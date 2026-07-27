/**
 * routes/chat.ts
 *
 * POST /chat  — Rav Menashe AI, streaming SSE
 *
 * Uses the AI Gateway for automatic provider fallback:
 *   Primary:   OpenAI gpt-4o-mini     (OPENAI_API_KEY)
 *   Secondary: Gemini 2.5-flash       (GOOGLE_API_KEY)
 *   Fallback:  Grok 3-mini            (GROK_API_KEY)
 *
 * SSE protocol:
 *   data: {"provider":"openai"}   ← first event, identifies active provider
 *   data: {"text":"..."}          ← one per streamed token chunk
 *   data: [DONE]                  ← end of stream
 *   data: {"error":"..."}         ← on failure (user-safe message only)
 *
 * GET /ai/health  — provider health snapshot (admin-safe, no secrets)
 */
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../lib/requireAuth";
import { aiRateLimiter } from "../lib/rateLimiter";
import { apiError } from "../lib/apiError";
import { gatewayStream } from "../ai/gateway";
import { getHealthSnapshot } from "../ai/health";

const router = Router();

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const calendarCtxSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tzid: z.string().optional(),
}).optional();

const chatBodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
  ctx: calendarCtxSchema,
});

/* ── POST /chat ─────────────────────────────────────────────────────────── */
router.post("/chat", aiRateLimiter, async (req, res) => {
  const parsed = chatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid messages", parsed.error.issues);
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const controller = new AbortController();
  // Use res.on("close") — NOT req.on("close").
  // express.json() consumes the request body before this handler runs, which
  // causes the req readable-stream to close immediately and fire "close" even
  // while the client is still connected.  res "close" fires only when the
  // actual response connection drops (client disconnects or response ends).
  res.on("close", () => controller.abort());

  try {
    const { provider, stream } = await gatewayStream(
      parsed.data.messages,
      controller.signal,
      parsed.data.ctx,
    );

    /* First event — tell the client which provider answered */
    res.write(`data: ${JSON.stringify({ provider })}\n\n`);

    for await (const text of stream) {
      if (controller.signal.aborted) break;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    /* All providers failed — send a user-safe error, never raw message */
    req.log.error({ msg: "AI gateway: all providers failed" });
    res.write(`data: ${JSON.stringify({ error: "I'm temporarily unavailable. Please try again in a moment." })}\n\n`);
    res.end();
  }
});

/* ── GET /ai/health ─────────────────────────────────────────────────────── */
router.get("/ai/health", (_req, res) => {
  const snapshot = getHealthSnapshot();
  const anyHealthy = Object.values(snapshot).some((p) => p.healthy);
  res.status(anyHealthy ? 200 : 503).json({
    status: anyHealthy ? "ok" : "degraded",
    providers: snapshot,
    timestamp: new Date().toISOString(),
  });
});

export default router;
