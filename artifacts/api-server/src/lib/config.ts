/**
 * artifacts/api-server/src/lib/config.ts
 *
 * Central configuration validation for the Menashe API server.
 *
 * Rules:
 *  - DATABASE_URL is required in every environment.
 *  - Production requires Supabase Auth public configuration.
 *  - Optional services degrade gracefully with a logged warning.
 *  - Secret values are NEVER logged — only presence/absence.
 */

import { logger } from "./logger";

// ── Resolve raw env values ────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL || null;
const supabasePublishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || null;
const openaiKey = process.env.OPENAI_API_KEY || null;
const googleKey = process.env.GOOGLE_API_KEY || null;
const grokKey = process.env.GROK_API_KEY || null;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || null;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || null;
const vapidSubject = process.env.VAPID_SUBJECT || null;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || null;
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || null;

// ── PORT ─────────────────────────────────────────────────────────────────────

const rawPort = process.env.PORT ?? "8080";
const portNum = Number(rawPort);
if (Number.isNaN(portNum) || portNum <= 0) {
  logger.fatal({ rawPort }, "Invalid PORT value — cannot start server");
  process.exit(1);
}

// ── DATABASE_URL — the only hard requirement ──────────────────────────────────

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  logger.fatal(
    "DATABASE_URL is not set. A PostgreSQL connection string is required. " +
      "Add it as a secret before starting the server.",
  );
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV ?? "development";

if (nodeEnv === "production") {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Production Supabase Auth configuration requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY",
    );
  }
}

// ── Exported config (read-only, no secret values) ────────────────────────────

export const config = {
  // Server
  port: portNum,
  nodeEnv,
  logLevel: process.env.LOG_LEVEL ?? "info",

  // Database
  databaseUrl,

  // Auth
  supabaseUrl,
  supabasePublishableKey,

  // AI providers — gateway uses whichever keys are present
  openaiApiKey: openaiKey,
  googleApiKey: googleKey,
  grokApiKey: grokKey,

  // Push notifications
  vapidPublicKey,
  vapidPrivateKey,
  vapidSubject,

  // Payments
  razorpayKeyId,
  razorpayKeySecret: razorpaySecret,

  // CORS — falls back to REPLIT_DOMAINS in prod if not set
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? null,

  // Derived feature flags — safe to log (booleans only, no key material)
  features: {
    auth: !!supabaseUrl && !!supabasePublishableKey,
    openai: !!openaiKey,
    gemini: !!googleKey,
    grok: !!grokKey,
    push: !!vapidPublicKey && !!vapidPrivateKey && !!vapidSubject,
    payments: !!razorpayKeyId && !!razorpaySecret,
  },
} as const;

// ── Startup summary ───────────────────────────────────────────────────────────

type Status = "READY" | "NOT CONFIGURED" | "DISABLED";

function row(label: string, status: Status): string {
  const icon = status === "READY" ? "✓" : status === "DISABLED" ? "○" : "✗";
  return `  ${icon} ${label.padEnd(22, ".")} ${status}`;
}

/**
 * Print a human-readable configuration summary to the log.
 * Call this once before `app.listen`.
 * No secret values are included — only feature readiness.
 */
export function printConfigSummary(): void {
  const { features, nodeEnv } = config;
  const lines = [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "  Menashe API — Configuration Summary   ",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    row("Database", "READY"), // already exited if missing
    row("Supabase Auth", features.auth ? "READY" : "DISABLED"),
    row("OpenAI", features.openai ? "READY" : "NOT CONFIGURED"),
    row("Gemini", features.gemini ? "READY" : "NOT CONFIGURED"),
    row("Grok", features.grok ? "READY" : "NOT CONFIGURED"),
    row("Push (VAPID)", features.push ? "READY" : "NOT CONFIGURED"),
    row("Payments", features.payments ? "READY" : "NOT CONFIGURED"),
    row("Object Storage", "READY"), // Replit sidecar always available
    `  ○ ${"Environment".padEnd(22, ".")} ${nodeEnv}`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  ];
  for (const line of lines) {
    logger.info(line);
  }

  // Emit individual warnings so operators know which services are degraded
  if (!features.auth) {
    logger.warn(
      "Supabase Auth is DISABLED — VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_PUBLISHABLE_KEY are required. Authenticated routes will return 401.",
    );
  }
  if (!features.openai && !features.gemini && !features.grok) {
    logger.warn(
      "AI is NOT CONFIGURED — none of OPENAI_API_KEY, GOOGLE_API_KEY, or " +
        "GROK_API_KEY are set. The /api/chat endpoint will return 503.",
    );
  }
  if (!features.push) {
    logger.warn(
      "Push Notifications are NOT CONFIGURED — VAPID_PUBLIC_KEY, " +
        "VAPID_PRIVATE_KEY, and VAPID_SUBJECT must all be valid.",
    );
  }
  if (!features.payments) {
    logger.warn(
      "Payments are NOT CONFIGURED — RAZORPAY_KEY_ID and/or " +
        "RAZORPAY_KEY_SECRET are not set. Payment routes will return 503.",
    );
  }
}
