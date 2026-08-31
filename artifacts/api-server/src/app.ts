import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import { replitAuthMiddleware, replitAuthRouter } from "./lib/replitAuth";
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
export function buildAllowedOrigins(): string[] | boolean {
  if (process.env.ALLOWED_ORIGINS) {
    const origins = process.env.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    if (origins.length === 0) {
      throw new Error("ALLOWED_ORIGINS must contain at least one origin");
    }
    for (const origin of origins) {
      let parsed: URL;
      try {
        parsed = new URL(origin);
      } catch {
        throw new Error("ALLOWED_ORIGINS contains an invalid origin");
      }
      if (
        parsed.protocol !== "https:" ||
        parsed.username ||
        parsed.password ||
        parsed.pathname !== "/" ||
        parsed.search ||
        parsed.hash
      ) {
        throw new Error(
          "ALLOWED_ORIGINS must contain HTTPS origins without paths or credentials",
        );
      }
    }
    return origins;
  }
  if (process.env.NODE_ENV !== "production") return true;
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const origins = replitDomains.split(",").map((d) => `https://${d.trim()}`);
    logger.info(
      { origins },
      "ALLOWED_ORIGINS not set — using REPLIT_DOMAINS as CORS allowlist",
    );
    return origins;
  }
  logger.warn(
    "ALLOWED_ORIGINS and REPLIT_DOMAINS are both unset — CORS will reject cross-origin requests",
  );
  return false;
}
const allowedOrigins = buildAllowedOrigins();

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins === true) {
        callback(null, true);
        return;
      }
      if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    strictTransportSecurity: {
      maxAge: 31_536_000,
      includeSubDomains: true,
    },
  }),
);

app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

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

app.use(replitAuthMiddleware());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(globalRateLimiter);

app.get("/api", (_req, res) => res.json({ status: "ok" }));
app.use("/api", replitAuthRouter);
app.use("/api", router);

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  const isProd = process.env.NODE_ENV === "production";
  res.status(500).json({
    error: "Internal server error",
    ...(isProd ? {} : { detail: err?.message }),
  });
});

export default app;
