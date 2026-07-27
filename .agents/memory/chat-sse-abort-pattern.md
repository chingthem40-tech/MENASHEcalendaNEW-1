---
name: Chat SSE abort pattern
description: Correct Express pattern for AbortController in SSE routes — use res.on("close") not req.on("close")
---

# Chat SSE AbortController Pattern

## Rule
In Express SSE routes that use `express.json()` (or any body-parsing middleware), always bind the `AbortController` to `res.on("close")`, never to `req.on("close")`.

## Why
`express.json()` consumes the request body stream before the route handler runs. Once the body is consumed, the `IncomingMessage` (req) readable stream closes and immediately fires its "close" event — even though the client is still connected. This prematurely aborts the `AbortController`, which cancels any downstream async operations (AI provider streams, fetch calls, etc.) before they can respond.

`res.on("close")` fires only when the actual HTTP response connection closes (genuine client disconnect or `res.end()`), making it the correct lifecycle anchor for SSE abort handling.

## How to apply
```typescript
// WRONG — fires as soon as request body is parsed
req.on("close", () => controller.abort());

// CORRECT — fires when client actually disconnects
res.on("close", () => controller.abort());
```

Apply to any SSE route (`Content-Type: text/event-stream`) that also uses `express.json()` or `express.urlencoded()` globally.
