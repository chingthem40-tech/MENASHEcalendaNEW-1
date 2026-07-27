---
name: AI Gateway architecture
description: Rav Menashe AI gateway — provider order, circuit breaker, SSE protocol, and root cause of original failures.
---

# AI Gateway (SPR-031A)

## Architecture
- Files live at `artifacts/api-server/src/ai/`
  - `systemPrompt.ts` — shared Rav Menashe personality prompt
  - `health.ts` — per-provider circuit breaker (opens after 3 consecutive failures, recovers after 5 min)
  - `providers/gemini.ts` — Gemini 2.5-flash adapter via `@google/genai`
  - `providers/grok.ts` — Grok 3-mini adapter via `openai` pkg pointing at `https://api.x.ai/v1`
  - `gateway.ts` — orchestrator: tries providers in order, probes first token, falls back on failure

## Provider priority order
1. Gemini (`GOOGLE_API_KEY`) — primary
2. Grok (`GROK_API_KEY`) — fallback

## SSE protocol (POST /chat)
```
data: {"provider":"gemini"}   ← first event, identifies active provider
data: {"text":"..."}          ← one per streamed token chunk
data: [DONE]                  ← end of stream
data: {"error":"..."}         ← user-safe message on total failure
```

## GET /ai/health
Returns `{ status: "ok"|"degraded", providers: { gemini: {...}, grok: {...} }, timestamp }`.
No auth required. Returns 503 if all providers are unhealthy.

## Root cause of original failures
`GOOGLE_API_KEY` was never set as a Replit secret — the server threw "not configured" and returned the error event silently. The frontend accumulated an empty string and showed nothing useful.

## Key design decisions
- Gateway probes the **first token** before declaring a provider alive — avoids marking success on a stream that opens but immediately errors mid-way
- Circuit breaker only opens after 3 *consecutive* failures, so transient errors don't cause unnecessary fallover
- All logged diagnostics are safe: only `errorType` (auth/rate_limit/timeout/network/config/unknown) and counts; never raw error messages or keys
- Frontend shows a small "via Gemini" / "via Grok" pill badge in the chat footer after response completes

**Why:** Single-provider setup with no health monitoring meant any key misconfiguration or transient outage silently broke the entire chat with no recovery path.
