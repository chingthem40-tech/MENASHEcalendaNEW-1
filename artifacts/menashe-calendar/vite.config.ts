import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { writeFileSync } from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";

const rawPort = process.env.PORT ?? "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "";

const apiTarget = process.env.API_URL ?? "http://localhost:8080";
const isNetlifyBuild =
  process.env.NETLIFY === "true" ||
  Boolean(process.env.NETLIFY_API_URL?.trim());
function validateNetlifyApiUrl(rawValue: string | undefined): string {
  const value = rawValue?.trim();

  if (!value) {
    throw new Error(
      "NETLIFY_API_URL is required for production Netlify builds. Set it to the HTTPS base URL of the deployed API server.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      "NETLIFY_API_URL must be a valid HTTPS URL for the deployed API server.",
    );
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const lowerValue = value.toLowerCase();
  const isReplitDevelopmentUrl =
    hostname === "replit.dev" ||
    hostname.endsWith(".replit.dev") ||
    hostname === "repl.co" ||
    hostname.endsWith(".repl.co");
  const hasPlaceholder = [
    "your_api_server_url",
    "your-api-server-url",
    "your-api-server",
    "example.com",
    "example.org",
    "example.net",
    "placeholder",
    "change-me",
    "changeme",
    "replace-me",
  ].some((marker) => lowerValue.includes(marker));

  if (parsed.protocol !== "https:") {
    throw new Error(
      "NETLIFY_API_URL must use HTTPS for production Netlify builds.",
    );
  }

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    isReplitDevelopmentUrl
  ) {
    throw new Error(
      "NETLIFY_API_URL must point to the deployed production API, not localhost, a loopback address, or a Replit development URL.",
    );
  }

  if (hasPlaceholder) {
    throw new Error(
      "NETLIFY_API_URL must be a real production API URL, not a placeholder.",
    );
  }

  if (parsed.username || parsed.password) {
    throw new Error(
      "NETLIFY_API_URL must not contain embedded credentials.",
    );
  }

  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new Error(
      "NETLIFY_API_URL must be the API server origin without a path; the existing rewrite adds /api/:splat.",
    );
  }

  return value.replace(/\/+$/, "");
}

function netlifyRedirectsPlugin(): Plugin {
  let outputDir: string | undefined;
  let productionRedirects: string | undefined;

  return {
    name: "netlify-production-redirects",

    configResolved(config) {
      outputDir = config.build.outDir;

      if (
        config.command === "build" &&
        config.mode === "production" &&
        isNetlifyBuild
      ) {
        const apiUrl = validateNetlifyApiUrl(process.env.NETLIFY_API_URL);
        productionRedirects = [
          "# Netlify redirect rules for the Menashe Calendar SPA",
          "# API proxy target is supplied at build time via NETLIFY_API_URL.",
          `/api/*  ${apiUrl}/api/:splat  200`,
          "",
          "# SPA fallback — all other routes serve index.html.",
          "/*  /index.html  200",
          "",
        ].join("\n");
      }
    },

    writeBundle() {
      if (!outputDir || !productionRedirects) return;
      writeFileSync(path.join(outputDir, "_redirects"), productionRedirects);
    },
  };
}

function assertBrowserReleaseGraphPlugin(): Plugin {
  const forbiddenPackagePaths = [
    "/node_modules/@expo/",
    "/node_modules/expo/",
    "/node_modules/expo-server-sdk/",
    "/node_modules/react-native/",
    "/node_modules/undici/",
  ];

  return {
    name: "assert-browser-release-graph",
    apply: "build",

    generateBundle() {
      const forbiddenModules = [...this.getModuleIds()]
        .map((moduleId) => moduleId.replaceAll("\\", "/"))
        .filter((moduleId) =>
          forbiddenPackagePaths.some((packagePath) =>
            moduleId.includes(packagePath),
          ),
        );

      if (forbiddenModules.length > 0) {
        this.error(
          [
            "The browser production bundle includes server/native build tooling:",
            ...forbiddenModules.map((moduleId) => `- ${moduleId}`),
          ].join("\n"),
        );
      }
    },
  };
}

/**
 * prefetchLazyChunksPlugin
 *
 * Runs only in production builds. It:
 *
 * 1. Collects lazy page chunk filenames from the Rollup bundle via
 *    `generateBundle` (the only place real hashed names are known).
 *
 * 2. In `transformIndexHtml` (enforce:"post" — runs after Vite has injected
 *    its own modulepreload tags):
 *    a. Downgrades `vendor-three` from `<link rel="modulepreload">` to
 *       `<link rel="prefetch">` — Three.js is only needed when the Memorial
 *       Sanctuary opens, not on first paint.
 *    b. Injects `<link rel="prefetch">` for every lazy page chunk so the
 *       browser fetches them in the background during idle time, making
 *       in-app navigation instant without downloading anything on first paint.
 */
function prefetchLazyChunksPlugin(): Plugin {
  // Page chunks — prefetched eagerly (user navigates between these often)
  const PAGE_PATTERNS = [
    /^Home-/,
    /^CalendarPage-/,
    /^ZmanimPage-/,
    /^SiddurPage-/,
    /^SettingsPage-/,
    /^Landing-/,
    /^PremiumPage-/,
  ];

  // High-frequency modal chunks — prefetched alongside pages so they open instantly
  const MODAL_PATTERNS = [
    /^DayModal-/,
    /^HolidaysModal-/,
    /^ParashahModal-/,
    /^DafYomiModal-/,
    /^ZmanimInfoModal-/,
    /^PrayerTimesModal-/,
    /^AnnouncementsModal-/,
    /^NotificationDrawer-/,
    /^ChatModal-/,
    /^ShabbatBanner-/,
  ];

  const lazyChunkNames: string[] = [];

  return {
    name: "prefetch-lazy-chunks",
    apply: "build",

    generateBundle(_options, bundle) {
      lazyChunkNames.length = 0;
      for (const fileName of Object.keys(bundle)) {
        if (!fileName.endsWith(".js")) continue;
        // Bundle keys are relative output paths like "assets/Home-abc123.js"
        // Match only against the basename portion
        const base = fileName.split("/").pop() ?? fileName;
        if (
          PAGE_PATTERNS.some((pat) => pat.test(base)) ||
          MODAL_PATTERNS.some((pat) => pat.test(base))
        ) {
          lazyChunkNames.push(fileName);
        }
      }
    },

    transformIndexHtml: {
      order: "post",
      handler(html) {
        // 1. Downgrade vendor-three: modulepreload → prefetch
        //    (Three.js is lazy — it must not block the initial page load)
        let out = html.replace(
          /(<link\s+rel=)"modulepreload"(\s+crossorigin\s+href="[^"]*vendor-three[^"]*">)/g,
          '$1"prefetch"$2',
        );

        // 2. Build prefetch tags for every lazy page chunk.
        //    `lazyChunkNames` entries are already relative paths like
        //    "assets/Home-abc123.js" — just prepend "./" for the HTML href.
        const base = basePath ? basePath.replace(/\/$/, "") + "/" : "./";
        const prefetchTags = lazyChunkNames
          .map(
            (name) =>
              `    <link rel="prefetch" crossorigin href="${base}${name}">`,
          )
          .join("\n");

        if (prefetchTags) {
          out = out.replace("</head>", `${prefetchTags}\n  </head>`);
        }

        return out;
      },
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    assertBrowserReleaseGraphPlugin(),
    netlifyRedirectsPlugin(),
    prefetchLazyChunksPlugin(),
    // Workbox PWA — injectManifest mode:
    // • Compiles src/sw.ts into dist/public/sw.js via a separate Vite sub-build
    // • Injects a content-hash precache manifest for all hashed JS/CSS/PNG chunks
    //   (vendor-three excluded — too large to pre-warm at install time)
    // • manifest:false because we have our own public/manifest.json
    // • devOptions.enabled:false — dev uses public/sw.js (manual SW v4)
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectManifest: {
        // Precache only the code bundles needed for the app shell:
        //   JS  — all hashed chunk files (vendor-*, page chunks, modals)
        //   CSS — compiled stylesheet(s)
        //   HTML — the SPA entry (index.html)
        //
        // We deliberately exclude images (PNG/SVG/WebP/JPEG) — they range
        // from a few kB up to 3 MB (memorial user photos) and are never needed
        // for the app to be functional offline.  The NavigationRoute in sw.ts
        // covers offline HTML fallback; image assets are runtime-cached on
        // first request by the StaleWhileRevalidate handler.
        globPatterns: ["**/*.{js,css,html}"],
        // Exclude Three.js — 1.5 MB is too heavy to pre-warm at SW install.
        // vendor-three gets StaleWhileRevalidate runtime caching instead.
        // Also exclude the SW file itself and any Workbox internal chunks.
        globIgnores: [
          "**/vendor-three-*.js",
          "**/sw.js",
          "**/sw.mjs",
          "**/workbox-*.js",
          "**/registerSW.js",
        ],
      },
      // We manage our own manifest.json in public/ — don't let the plugin touch it.
      manifest: false,
      devOptions: {
        // In dev, Vite serves public/sw.js directly (the hand-written v4 SW).
        // The Workbox build only runs during production builds.
        enabled: false,
      },
    }),
    // Force full-page reload for large files where HMR corrupts React state.
    {
      name: "full-reload-large-modules",
      handleHotUpdate({ file, server }) {
        if (
          file.includes("Home.tsx") ||
          file.includes("translations.ts")
        ) {
          server.ws.send({ type: "full-reload" });
          return [];
        }
      },
    },
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
          // Strip "data-component-name" injected by cartographer from R3F/Three.js
          // scene files. R3F 9.x parses hyphenated props as nested paths — it
          // tries obj.data["component-name"] = value and throws a TypeError when
          // the Three.js object's .data field is not a plain object.
          {
            name: "strip-r3f-cartographer-data-props",
            enforce: "post" as const,
            transform(code: string, id: string) {
              if (!id.includes("/scene/") && !id.includes("MemorialValley3D")) return;
              const cleaned = code.replace(/"data-component-name":\s*"[^"]*",?\s*/g, "");
              if (cleaned === code) return;
              return { code: cleaned, map: null };
            },
          },
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js ecosystem — only loaded when Memorial Sanctuary opens
          if (
            id.includes("/three/") ||
            id.includes("/@react-three/") ||
            id.includes("/postprocessing/") ||
            id.includes("/@react-spring/three")
          ) return "vendor-three";

          // Framer Motion — animation library
          if (id.includes("/framer-motion/")) return "vendor-motion";

          // React core + DOM — kept together so they share a single scope
          if (
            id.includes("/react-dom/") ||
            id.includes("/react/") ||
            id.includes("/scheduler/")
          ) return "vendor-react";

          // Hebrew calendar
          if (id.includes("/@hebcal/")) return "vendor-hebcal";

          // Lucide icons — large icon set
          if (id.includes("/lucide-react/")) return "vendor-lucide";

          // Radix UI primitives
          if (id.includes("/@radix-ui/")) return "vendor-radix";
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
    fs: {
      strict: false,
    },
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        // Preserve the public Preview origin for the managed auth callback.
        xfwd: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
