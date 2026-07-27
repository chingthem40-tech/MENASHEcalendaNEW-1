import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { globalRateLimiter } from "./lib/rateLimiter";

const app: Express = express();

// Replit runs behind a reverse proxy — trust the X-Forwarded-For header
// so that express-rate-limit can correctly identify client IPs.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// CORS: prefer ALLOWED_ORIGINS; fall back to REPLIT_DOMAINS in production
// so the app works on first deploy without manual secret configuration.
// In development (NODE_ENV !== 'production'), allow all origins for convenience.
function buildAllowedOrigins(): string[] | boolean {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  }
  if (process.env.NODE_ENV !== "production") return true;
  // Production fallback: derive from Replit-managed REPLIT_DOMAINS
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const origins = replitDomains
      .split(",")
      .map((d) => `https://${d.trim()}`);
    logger.info({ origins }, "ALLOWED_ORIGINS not set — using REPLIT_DOMAINS as CORS allowlist");
    return origins;
  }
  logger.warn("ALLOWED_ORIGINS and REPLIT_DOMAINS are both unset — CORS will reject cross-origin requests");
  return false;
}
const allowedOrigins = buildAllowedOrigins();

app.use(cors({ credentials: true, origin: allowedOrigins }));
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

// Guard: clerkMiddleware throws assertValidSecretKey when CLERK_SECRET_KEY is
// absent, which returns HTTP 500 for every request and blocks all routes —
// including unauthenticated ones like POST /chat.  Only attach it when the
// key is actually present; routes using requireAuth will still return 401
// correctly because getAuth(req) gracefully returns null auth when the
// middleware was not installed.
if (process.env.CLERK_SECRET_KEY) {
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
    })),
  );
} else {
  logger.warn(
    "CLERK_SECRET_KEY not set — Clerk authentication middleware disabled; " +
    "authenticated routes will return 401 until the key is provided.",
  );
}

// Health check — placed before rate limiter so it is never throttled
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(globalRateLimiter);

app.use("/api", router);

// In production, serve the built React frontend from the same process.
// The frontend builds to artifacts/menashe-calendar/dist/public.
// __dirname is shimmed by esbuild banner to the dir of dist/index.mjs,
// so we step two levels up: dist/ → api-server/ → artifacts/ → workspace root,
// then into menashe-calendar/dist/public.
if (process.env.NODE_ENV === "production") {
  const frontendDir = path.resolve(
    __dirname,
    "../../menashe-calendar/dist/public",
  );
  if (fs.existsSync(frontendDir)) {
    logger.info({ frontendDir }, "Serving static frontend");
    app.use(
      express.static(frontendDir, {
        etag: true,
        // Per-file Cache-Control strategy:
        //
        //   /assets/*.js  and  /assets/*.css
        //     → "public, max-age=31536000, immutable"
        //     Vite injects a content-hash into every asset filename (e.g.
        //     vendor-react-CPl9HvQc.js).  The hash changes whenever the file
        //     changes, so it is safe to tell the browser "cache this forever
        //     and never revalidate".  The `immutable` directive further
        //     suppresses the browser's conditional GET on reload — zero extra
        //     network round-trips for returning users.
        //
        //   Everything else (index.html, manifest.json, sw.js, icons …)
        //     → "public, no-cache"
        //     These files are not content-hashed, so they must always be
        //     revalidated.  `no-cache` still allows the browser to serve from
        //     its local cache when the ETag matches, making the response
        //     instant while guaranteeing freshness.
        setHeaders(res, filePath) {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader(
              "Cache-Control",
              "public, max-age=31536000, immutable",
            );
          } else {
            res.setHeader("Cache-Control", "public, no-cache");
          }
        },
      }),
    );
    // SPA fallback — all non-API routes return index.html
    app.get("*", (_req, res) => {
      res.sendFile(path.join(frontendDir, "index.html"));
    });
  } else {
    logger.warn({ frontendDir }, "Frontend dist not found — static serving skipped");
  }
}

export default app;
