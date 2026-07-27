/**
 * ai/gateway.ts
 *
 * AI Gateway — ordered provider fallback with health circuit breakers.
 *
 * Priority order: OpenAI → Gemini → Grok
 * - Skips providers that are unhealthy (circuit open)
 * - Skips providers that are not configured (missing API key)
 * - Falls back to next provider on stream error
 * - Logs safe diagnostics only (no secrets, no raw error messages)
 * - Reports which provider answered via the returned `provider` name
 */
import { logger } from "../lib/logger";
import {
  isHealthy,
  recordSuccess,
  recordFailure,
  classifyError,
  type ProviderName,
} from "./health";
import { isOpenAIConfigured, streamOpenAI } from "./providers/openai";
import { isGeminiConfigured, streamGemini } from "./providers/gemini";
import { isGrokConfigured, streamGrok } from "./providers/grok";
import type { ChatMessage } from "./providers/gemini";
import type { CalendarCtx } from "./types";

export type { ChatMessage };
export type { CalendarCtx };

export interface GatewayStreamResult {
  provider: ProviderName;
  stream: AsyncGenerator<string>;
}

interface Provider {
  name: ProviderName;
  configured: () => boolean;
  stream: (messages: ChatMessage[], signal: AbortSignal, ctx?: CalendarCtx) => AsyncIterable<string>;
}

const PROVIDERS: Provider[] = [
  { name: "openai", configured: isOpenAIConfigured, stream: streamOpenAI },
  { name: "gemini", configured: isGeminiConfigured, stream: streamGemini },
  { name: "grok",   configured: isGrokConfigured,   stream: streamGrok   },
];

/**
 * Attempts providers in priority order.
 * Probes each provider by reading the first token — if that succeeds the
 * provider is alive and the assembled stream is returned.
 * Falls back to the next provider on any error or empty response.
 * Throws if all providers fail or none are configured.
 */
export async function gatewayStream(
  messages: ChatMessage[],
  signal: AbortSignal,
  ctx?: CalendarCtx,
): Promise<GatewayStreamResult> {
  const tried: { name: ProviderName; reason: string }[] = [];

  for (const p of PROVIDERS) {
    if (!p.configured()) {
      tried.push({ name: p.name, reason: "not_configured" });
      continue;
    }
    if (!isHealthy(p.name)) {
      tried.push({ name: p.name, reason: "circuit_open" });
      logger.warn({ provider: p.name, reason: "circuit_open" }, "AI Gateway: skipping unhealthy provider");
      continue;
    }

    try {
      const iter = p.stream(messages, signal, ctx);
      const it   = iter[Symbol.asyncIterator]();

      // Probe: try to get the first token to verify the provider is alive
      const firstResult = await it.next();

      if (firstResult.done) {
        // Provider returned an empty stream — treat as failure
        const diag = recordFailure(p.name, "empty_response");
        logger.warn(diag, "AI Gateway: provider returned empty stream");
        tried.push({ name: p.name, reason: "empty_response" });
        continue;
      }

      // First token arrived — provider is healthy
      recordSuccess(p.name);
      logger.info({ provider: p.name }, "AI Gateway: provider selected");

      // Build a generator that re-plays the first token then continues
      const name = p.name;
      const stream = (async function* reassembled(): AsyncGenerator<string> {
        yield firstResult.value as string;
        while (true) {
          const next = await it.next();
          if (next.done) break;
          yield next.value as string;
        }
      })();

      return { provider: name, stream };

    } catch (err: unknown) {
      const errorType = classifyError(err);
      const diag = recordFailure(p.name, errorType);
      // Log a sanitized excerpt of the error message (first 120 chars) to aid
      // debugging without risking secret leakage in log aggregators.
      const errMsg = err instanceof Error
        ? err.message.slice(0, 120).replace(/sk-[A-Za-z0-9-_]+/g, "[KEY]")
        : "non-Error thrown";
      logger.warn({ ...diag, errMsg }, "AI Gateway: provider failed, trying next");
      tried.push({ name: p.name, reason: errorType });
    }
  }

  logger.error({ tried }, "AI Gateway: all providers failed");
  throw new Error(
    `All AI providers unavailable. Tried: ${tried.map(t => `${t.name}(${t.reason})`).join(", ")}`,
  );
}
