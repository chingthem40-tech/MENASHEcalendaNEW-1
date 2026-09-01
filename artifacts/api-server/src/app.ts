import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { supabaseAuthMiddleware, supabaseAuthRouter } from "./lib/supabaseAuth";
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

function forwardedRequestOrigin(req: Request): string | null {
  const forwardedHost = (req.get("x-forwarded-host") ?? req.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  if (!forwardedHost) return null;

  const forwardedProto = req
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const protocol = forwardedProto === "http" ? "http" : "https";
  return `${protocol}://${forwardedHost}`;
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  origins: string[] | boolean,
  requestOrigin?: string | null,
): boolean {
  if (!origin || origins === true) return true;
  if (requestOrigin && origin === requestOrigin) return true;
  return Array.isArray(origins) && origins.includes(origin);
}

app.use((req, res, next) => {
  cors({
    credentials: true,
    origin(origin, callback) {
      if (
        isCorsOriginAllowed(
          origin,
          allowedOrigins,
          forwardedRequestOrigin(req),
        )
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
  })(req, res, next);
});

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

app.use(supabaseAuthMiddleware());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(globalRateLimiter);

app.get("/api", (_req, res) => res.json({ status: "ok" }));
app.use("/api", supabaseAuthRouter);
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
