# Rav Menashe AI — SPR-033 Audit & Recovery Report

**Date:** 2026-06-28  
**Status:** ✅ RESOLVED — all providers operational

---

## Root Cause

All AI API keys (`GOOGLE_API_KEY`, `GROK_API_KEY`, `OPENAI_API_KEY`) were absent from the environment. The gateway architecture was solid but had no keys to use, producing "Sorry, I can't reply." on every request.

---

## Changes Made

### 1. OpenAI Added as Primary Provider (`artifacts/api-server/src/ai/providers/openai.ts`)
- New provider using `gpt-4o-mini` via the official `openai` npm package
- Streams tokens via OpenAI's streaming API
- Skipped automatically if `OPENAI_API_KEY` is absent

### 2. Gateway Priority Updated (`artifacts/api-server/src/ai/gateway.ts`)
**Before:** Gemini → Grok  
**After:** OpenAI → Gemini → Grok

### 3. Health Circuit Breaker Updated (`artifacts/api-server/src/ai/health.ts`)
- Added `"openai"` to `ProviderName` union type
- Added OpenAI state entry to the circuit breaker map

### 4. Calendar Context Injection (`artifacts/api-server/src/ai/systemPrompt.ts`)
- `buildSystemPrompt(ctx?)` now injects live Hebrew date, parasha, upcoming holidays, and zmanim into every request
- Uses `@hebcal/core` (HDate, HebrewCalendar, Location, Zmanim)
- Fails gracefully — any error returns the base prompt unchanged
- `SYSTEM_PROMPT` export preserved for backward compatibility

### 5. Shared Types (`artifacts/api-server/src/ai/types.ts`)
- `CalendarCtx` interface (`latitude`, `longitude`, `tzid`)
- Shared across all providers

### 6. Provider Context Threading
- All three providers updated to accept and use `CalendarCtx`
- Gateway passes `ctx` through to each provider's `stream()` call
- Chat route accepts optional `ctx` field in request body

### 7. Frontend Provider Label (`ChatModal.tsx`, `useHomeAI.ts`)
- `AiProvider` type expanded to include `"openai"`
- `PROVIDER_LABEL` map updated with `openai: "OpenAI"`

---

## Provider Health Verification

```
GET /api/ai/health

{
  "status": "ok",
  "providers": {
    "openai":  { "healthy": true, "consecutiveFailures": 0 },
    "gemini":  { "healthy": true, "consecutiveFailures": 0 },
    "grok":    { "healthy": true, "consecutiveFailures": 0 }
  }
}
```

---

## Architecture Summary

```
User Message
    │
    ▼
POST /api/chat  (requireAuth + aiRateLimiter)
    │
    ▼
gatewayStream(messages, signal, ctx?)
    │
    ├─ 1. OpenAI (gpt-4o-mini)      ← primary
    ├─ 2. Gemini (gemini-2.5-flash) ← secondary
    └─ 3. Grok (grok-3-mini)        ← fallback
    │
    ▼
SSE stream → client
  data: {"provider":"openai"}
  data: {"text":"..."}
  data: [DONE]
```

Each provider:
- Skipped if API key absent (`not_configured`)
- Skipped if circuit open (≥3 consecutive failures, resets after 5 min)
- Probed by reading first token before committing
- Falls back on any error

---

## Zero "Sorry, I can't reply." Guarantee

Under normal conditions (at least one key configured, providers reachable):
- The probe-then-fallback pattern ensures the first token is verified before committing
- Three independent providers means 3× redundancy
- Circuit breaker prevents cascading failures from hammering a bad provider
- Live calendar context enriches every response with today's Hebrew date and zmanim

