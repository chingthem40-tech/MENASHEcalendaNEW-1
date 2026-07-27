# RavMenasheAI — HOTFIX-001

**Date:** 2026-06-28  
**Status:** ✅ RESOLVED  
**Severity:** P0 — complete AI unavailability  

---

## 1. Health Check Results

**Before fix:**
```
GET /api/ai/health → HTTP 500 (HTML error — Clerk middleware threw before route handlers ran)
```

**After fix:**
```json
{
  "status": "ok",
  "providers": {
    "openai":  { "healthy": true,  "consecutiveFailures": 1, "lastErrorType": "unknown" },
    "gemini":  { "healthy": true,  "consecutiveFailures": 0, "totalSuccesses": 1 },
    "grok":    { "healthy": true,  "consecutiveFailures": 0 }
  }
}
```

Provider notes:
- **Gemini** — ✅ `GOOGLE_API_KEY` valid, responding successfully (primary active provider)
- **OpenAI** — ⚠️ `OPENAI_API_KEY` set but project `proj_D11FJG63JNZNmqp22KQQ1KgY` has no access to `gpt-4o-mini`; gateway falls back correctly
- **Grok** — ⚠️ `GROK_API_KEY` provided was invalid (400 "Incorrect API key"); gateway falls back correctly

---

## 2. Network Trace

**Request:**
```
POST /api/chat  HTTP/1.1
Content-Type: application/json
Body: {"messages":[{"role":"user","content":"Shalom!..."}]}
```

**Before fix — response:**
```
HTTP 200  Content-Type: text/event-stream
data: {"error":"I'm temporarily unavailable. Please try again in a moment."}
```

**After fix — response:**
```
HTTP 200  Content-Type: text/event-stream
data: {"provider":"gemini"}
data: {"text":"Shalom dear friend! It's wonderful to hear from you.\n\nToday's Hebrew date is **13 Tamuz 5786**..."}
data: [DONE]
```

---

## 3. Backend Log Excerpts

### Before fix — premature abort
```
[WARN] AI Gateway: provider failed, trying next
  provider: "openai"  errorType: "unknown"  errMsg: "Request was aborted."

[WARN] AI Gateway: provider returned empty stream
  provider: "gemini"  errorType: "empty_response"

[WARN] AI Gateway: provider failed, trying next
  provider: "grok"  errorType: "unknown"  errMsg: "Request was aborted."

[ERROR] AI Gateway: all providers failed
```

### After fix — successful Gemini response
```
[INFO] AI Gateway: provider selected  provider: "gemini"
[INFO] request completed  statusCode: 200  responseTime: ~1500ms
```

---

## 4. Execution Flow Analysis

```
User message → POST /api/chat
  ↓
express.json() middleware — parses body, CONSUMES request stream
  ↓
req "close" event fires (req stream now closed) ← BUG: AbortController.abort() called HERE
  ↓
gatewayStream() → OpenAI:  signal already aborted → "Request was aborted."
                → Gemini:  sendMessageStream() starts; loop checks signal.aborted → true → return
                           first iterator probe returns done=true → "empty_response"
                → Grok:    signal already aborted → "Request was aborted."
  ↓
All providers failed → "I'm temporarily unavailable."
```

---

## 5. Root Cause

**PRIMARY — Premature AbortController abort via `req.on("close")` in `routes/chat.ts`**

```typescript
// BEFORE (broken)
req.on("close", () => controller.abort());

// AFTER (fixed)
res.on("close", () => controller.abort());
```

`express.json()` fully consumes the request body stream before the route handler runs. Once the body is consumed, the `IncomingMessage` (req) readable stream transitions to closed, firing its "close" event. This immediately aborted the `AbortController`, which was passed as the `signal` to all three AI providers:

- **OpenAI / Grok**: received the already-aborted signal directly → threw `"Request was aborted."`
- **Gemini**: `sendMessageStream` didn't receive the signal, but the `for await` loop's `if (signal.aborted) return` guard fired on the first iteration before any token could be yielded → generator returned with `done: true` → classified as `empty_response`

`res.on("close")` fires only when the actual HTTP response connection closes (client disconnect or `res.end()`), which is the correct lifecycle event for SSE abort handling.

**SECONDARY — `clerkMiddleware` throwing on every request when `CLERK_SECRET_KEY` is absent**

```typescript
// BEFORE (broken)
app.use(clerkMiddleware(...));
// → assertValidSecretKey() throws → HTTP 500 HTML for ALL routes

// AFTER (fixed)
if (process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware(...));
} else {
  logger.warn("CLERK_SECRET_KEY not set...");
}
```

This prevented `/api/ai/health` and other routes from responding with proper JSON.

**TERTIARY — All AI provider API keys were missing from the environment**

Without any keys, all three providers were `not_configured` and the gateway threw immediately. Resolved by adding `OPENAI_API_KEY`, `GOOGLE_API_KEY`, and `GROK_API_KEY` to Replit Secrets.

---

## 6. Fix Applied

Three changes across two files:

### `artifacts/api-server/src/routes/chat.ts`
- Changed `req.on("close", ...)` → `res.on("close", ...)` to tie AbortController lifecycle to response connection, not request body stream.

### `artifacts/api-server/src/app.ts`
- Wrapped `clerkMiddleware` application in `if (process.env.CLERK_SECRET_KEY)` guard. When the key is absent the middleware is skipped; authenticated routes return 401 (via `requireAuth`) rather than 500.

### `artifacts/api-server/src/ai/gateway.ts`
- Added sanitized `errMsg` field to provider-failure log entries (first 120 chars, API key patterns redacted) to expose actual error messages without requiring raw exception propagation.

---

## 7. Verification Steps

```bash
# 1. Health check
curl http://localhost:8080/api/ai/health
# Expected: HTTP 200, status "ok", all providers healthy

# 2. Live chat (SSE streaming)
curl -N -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Shalom! What is today'\''s Hebrew date?"}]}'
# Expected:
#   data: {"provider":"gemini"}
#   data: {"text":"..."}
#   data: [DONE]

# 3. Gateway fallback
# (OpenAI key has quota/access issues; Gemini responds; Grok key is invalid)
# Fallback order: openai(skip) → gemini(✅ selected) → grok(not reached)
```

---

## 8. Final Status

| Check | Status |
|---|---|
| Rav Menashe AI responds successfully | ✅ |
| No "I'm temporarily unavailable." during normal operation | ✅ |
| AI Gateway fallback verified (Gemini selected after OpenAI fails) | ✅ |
| Streaming verified (SSE token-by-token delivery) | ✅ |
| Provider selection verified | ✅ |
| No new TypeScript errors introduced | ✅ |
| No architecture changes outside hotfix scope | ✅ |

**Active provider:** Gemini 2.5 Flash (`GOOGLE_API_KEY`)

**Remaining non-blocking issues:**
- OpenAI key's project lacks model access — need to upgrade plan or use a different project key
- Grok key was incorrect — replace with valid xAI API key to enable fallback chain
- `CLERK_SECRET_KEY` not set — authenticated routes return 401; obtain from Auth pane in workspace toolbar
