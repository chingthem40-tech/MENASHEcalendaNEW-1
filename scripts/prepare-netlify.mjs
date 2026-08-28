import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rawApiUrl = process.env.NETLIFY_API_URL?.trim();

if (!rawApiUrl) {
  throw new Error(
    "NETLIFY_API_URL is required for a Netlify production build. " +
      "Set it to the HTTPS origin of the deployed Express API, for example " +
      "https://api.example.com.",
  );
}

let apiUrl;
try {
  apiUrl = new URL(rawApiUrl);
} catch {
  throw new Error("NETLIFY_API_URL must be a valid absolute HTTPS URL.");
}

if (apiUrl.protocol !== "https:") {
  throw new Error("NETLIFY_API_URL must use HTTPS.");
}

if (
  apiUrl.username ||
  apiUrl.password ||
  apiUrl.search ||
  apiUrl.hash ||
  (apiUrl.pathname !== "" && apiUrl.pathname !== "/")
) {
  throw new Error(
    "NETLIFY_API_URL must be an origin only, without credentials, path, query, or hash.",
  );
}

const hostname = apiUrl.hostname.toLowerCase();
if (
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "0.0.0.0" ||
  hostname === "::1" ||
  hostname.endsWith(".replit.dev")
) {
  throw new Error(
    "NETLIFY_API_URL must point to a public production backend, not localhost or a development domain.",
  );
}

const redirectsPath = path.resolve(
  "artifacts/menashe-calendar/dist/public/_redirects",
);
const redirects = await readFile(redirectsPath, "utf8");
const apiRule = /^\/api\/\*\s+https:\/\/YOUR_API_SERVER_URL\/api\/:splat\s+200$/m;

if (!apiRule.test(redirects)) {
  throw new Error(
    `Expected the existing API placeholder rule in ${redirectsPath}; refusing to rewrite an unexpected redirect file.`,
  );
}

const productionRedirects = redirects.replace(
  apiRule,
  `/api/*  ${apiUrl.origin}/api/:splat  200`,
);

await writeFile(redirectsPath, productionRedirects);
console.log(`Configured Netlify API proxy for ${apiUrl.origin}`);