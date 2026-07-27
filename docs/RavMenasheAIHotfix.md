# Rav Menashe AI — Hotfix: Always Returns "Temporarily Unavailable"

## Root Cause

**All three AI providers are unconfigured.** None of the required API keys exist as Replit secrets.

The AI gateway (`artifacts/api-server/src/ai/gateway.ts`) iterates providers in priority order:
1. OpenAI → `process.env.OPENAI_API_KEY` → **undefined** → skip (`not_configured`)
2. Gemini → `process.env.GOOGLE_API_KEY` → **undefined** → skip (`not_configured`)
3. Grok   → `process.env.GROK_API_KEY`   → **undefined** → skip (`not_configured`)

After all three are skipped, the gateway throws:
```
All AI providers unavailable. Tried: openai(not_configured), gemini(not_configured), grok(not_configured)
```

The chat route catches this and streams the "temporarily unavailable" message to the client.

## Evidence

**Server log** (exact entry from running server, `artifacts/api-server: API Server` workflow):
```
[19:20:02.163] ERROR (1812): AI Gateway: all providers failed
    tried: [
      { "name": "openai", "reason": "not_configured" },
      { "name": "gemini", "reason": "not_configured" },
      { "name": "grok",   "reason": "not_configured" }
    ]
```

**Secret audit** (checked via Replit secrets API):
```json
{
  "OPENAI_API_KEY": false,
  "GOOGLE_API_KEY": false,
  "GROK_API_KEY":   false
}
```

**Code paths confirmed:**
- `providers/openai.ts:17` — `isOpenAIConfigured(): boolean { return !!process.env.OPENAI_API_KEY; }`
- `providers/gemini.ts:17` — `isGeminiConfigured(): boolean { return !!process.env.GOOGLE_API_KEY; }`
- `providers/grok.ts:15`   — `isGrokConfigured(): boolean { return !!process.env.GROK_API_KEY; }`

Note: The Replit OpenAI and Gemini integrations (`javascript_openai_ai_integrations`, `javascript_gemini_ai_integrations`) are **npm blueprints only** — they install packages but do NOT inject API keys. Keys must be provided manually as Replit secrets.

## Stack Trace

```
gatewayStream() → all providers skipped (not_configured)
  → throw Error("All AI providers unavailable. Tried: ...")
    ← caught in routes/chat.ts
      → controller.streamChat() returns fallback message
        → client receives: "I'm temporarily unavailable. Please try again in a moment."
```

## Fix Required

Add at least one of the following as a Replit secret. The gateway tries them in order — only one is needed for the AI to work.

| Secret Name | Provider | Model | Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | OpenAI | gpt-4o-mini | Primary (fastest) |
| `GOOGLE_API_KEY` | Gemini | gemini-2.5-flash | Secondary fallback |
| `GROK_API_KEY` | xAI Grok | grok-3-mini | Final fallback |

**Exact env var names matter:**
- Gemini uses `GOOGLE_API_KEY` (not `GEMINI_API_KEY`)
- Grok uses `GROK_API_KEY` (not `XAI_API_KEY`)

## Verification

After adding the secret(s) and restarting the `artifacts/api-server: API Server` workflow, the server log should show:

```
INFO: AI Gateway: provider selected  { provider: "openai" }  (or gemini / grok)
```

And the chat endpoint should begin returning actual AI responses.

## No Code Changes Required

The gateway code is correct. The `isXxxConfigured()` checks are working exactly as designed. The only fix needed is adding the missing API key secrets to the Replit environment.
