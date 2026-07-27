/**
 * ai/health.ts
 *
 * Per-provider circuit breaker.
 * - Opens after FAILURE_THRESHOLD consecutive failures
 * - Auto-recovers (half-open probe) after RECOVERY_MS
 * - Resets on any successful call
 */

export type ProviderName = "openai" | "gemini" | "grok";

const FAILURE_THRESHOLD = 3;
const RECOVERY_MS = 5 * 60 * 1000; // 5 minutes

interface ProviderState {
  consecutiveFailures: number;
  lastFailureAt: number | null;
  totalFailures: number;
  totalSuccesses: number;
  lastErrorType: string | null;
}

const state = new Map<ProviderName, ProviderState>([
  ["openai", { consecutiveFailures: 0, lastFailureAt: null, totalFailures: 0, totalSuccesses: 0, lastErrorType: null }],
  ["gemini", { consecutiveFailures: 0, lastFailureAt: null, totalFailures: 0, totalSuccesses: 0, lastErrorType: null }],
  ["grok",   { consecutiveFailures: 0, lastFailureAt: null, totalFailures: 0, totalSuccesses: 0, lastErrorType: null }],
]);

function getState(name: ProviderName): ProviderState {
  return state.get(name)!;
}

/** Returns true if the provider is healthy / should be attempted. */
export function isHealthy(name: ProviderName): boolean {
  const s = getState(name);
  if (s.consecutiveFailures < FAILURE_THRESHOLD) return true;
  // Circuit is open — allow half-open probe after recovery window
  if (s.lastFailureAt !== null && Date.now() - s.lastFailureAt >= RECOVERY_MS) return true;
  return false;
}

/** Call on a successful response from this provider. */
export function recordSuccess(name: ProviderName): void {
  const s = getState(name);
  s.consecutiveFailures = 0;
  s.totalSuccesses++;
  s.lastErrorType = null;
}

/**
 * Call on a failure. Returns a safe loggable object (no secrets / full error text).
 * errorType should be a short classification: "auth", "rate_limit", "network", "timeout", "unknown"
 */
export function recordFailure(name: ProviderName, errorType: string): { provider: string; errorType: string; consecutive: number } {
  const s = getState(name);
  s.consecutiveFailures++;
  s.lastFailureAt = Date.now();
  s.totalFailures++;
  s.lastErrorType = errorType;
  return { provider: name, errorType, consecutive: s.consecutiveFailures };
}

/** Snapshot of all provider health for the /ai/health endpoint. */
export function getHealthSnapshot(): Record<ProviderName, {
  healthy: boolean;
  consecutiveFailures: number;
  totalFailures: number;
  totalSuccesses: number;
  lastErrorType: string | null;
  circuitOpenUntil: number | null;
}> {
  const result: any = {};
  for (const [name, s] of state.entries()) {
    const circuitOpen = s.consecutiveFailures >= FAILURE_THRESHOLD;
    const circuitOpenUntil =
      circuitOpen && s.lastFailureAt !== null
        ? s.lastFailureAt + RECOVERY_MS
        : null;
    result[name] = {
      healthy: isHealthy(name as ProviderName),
      consecutiveFailures: s.consecutiveFailures,
      totalFailures: s.totalFailures,
      totalSuccesses: s.totalSuccesses,
      lastErrorType: s.lastErrorType,
      circuitOpenUntil,
    };
  }
  return result;
}

/** Classify a raw error into a safe, loggable type string. */
export function classifyError(err: unknown): string {
  if (!(err instanceof Error)) return "unknown";
  const msg = err.message.toLowerCase();
  if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("401")) return "auth";
  if (msg.includes("quota") || msg.includes("rate") || msg.includes("429")) return "rate_limit";
  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("network") || msg.includes("econnrefused") || msg.includes("enotfound")) return "network";
  if (msg.includes("not configured") || msg.includes("not found") || msg.includes("404")) return "config";
  return "unknown";
}
