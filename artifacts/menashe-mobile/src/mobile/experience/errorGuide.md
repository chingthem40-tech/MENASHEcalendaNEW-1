# errorGuide.md
### Menashe Experience Language — Phase 12: Error Language

---

> Friendly. Human. Recovery first. Never technical. Never blame the user.

Errors in Menashe Calendar are conversations, not warnings.
When something goes wrong, the app speaks to the user as a trusted friend would —
calm, informative, and already working on a solution.

---

## Core Rules

1. **Recovery first.** Every error message includes a path forward. "What can you do now?"
2. **Never technical.** HTTP codes, stack traces, database errors — never shown to users.
3. **Never blame.** The user did not cause the error. The phrasing must reflect this.
4. **First person for the app.** "We couldn't load…" — not "Failed to load…"
5. **Short.** The error headline is 5–8 words. The description is 1–2 sentences.
6. **Warm.** The tone matches the rest of the app — never cold, never robotic.

---

## Error Classification

### Class A — Recoverable, Minor
User can immediately retry without losing any work.

**UI:** Alert Card (inline, full-width, gold/amber border)
**Haptic:** None
**Duration:** Persistent until resolved or dismissed

Examples: Network timeout on pull-to-refresh, failed image load, location service temporarily unavailable.

---

### Class B — Recoverable, Blocking
The current task cannot complete, but the user's data is safe. They must take an action to continue.

**UI:** Toast (3.5s, amber) for minor blocking — Alert Card for significant blocking
**Haptic:** `NotificationFeedbackType.Warning`
**Duration:** Persistent until action taken

Examples: Could not save yahrzeit record (network error), could not send notification, calendar event conflict.

---

### Class C — Unrecoverable, Non-Data-Loss
A feature is unavailable. The user's data is safe.

**UI:** Empty state replacement with error variant (illustration + headline + description + retry)
**Haptic:** `NotificationFeedbackType.Error`
**Duration:** Persistent until connection restored or retry succeeds

Examples: AI service unavailable, community feed offline, push notification service down.

---

### Class D — Critical, Potential Data Impact
Something may have gone wrong with the user's data or account. Requires explicit acknowledgement.

**UI:** Dialog (modal) with explicit acknowledgement button
**Haptic:** `NotificationFeedbackType.Error`
**Duration:** Modal — cannot be dismissed without choosing an action

Examples: Sync conflict between local and server yahrzeit data, session expired during a create operation.

---

## Error Message Templates

### Network Error (most common)
```
Headline:   "Couldn't connect right now"
Body:       "Check your connection and we'll try again."
Primary:    "Try Again"
Secondary:  "Work offline"  (if offline content is available)
```

### Timeout
```
Headline:   "Taking longer than expected"
Body:       "Our servers are busy. Your changes are safe."
Primary:    "Try Again"
```

### Server Error (5xx)
```
Headline:   "Something went wrong on our end"
Body:       "We're looking into it. Nothing you did caused this."
Primary:    "Try Again"
Secondary:  "Go back"
```

### Not Found (404)
```
Headline:   "We can't find that"
Body:       "This content may have been moved or removed."
Primary:    "Go to Home"
```

### Permission Denied
```
Headline:   "We need your permission"
Body:       "To show you prayer times, we need your location. Tap below to allow it."
Primary:    "Allow Location"
Secondary:  "Use manual city"
```

### Session Expired
```
Headline:   "You've been signed out"
Body:       "For your security, we signed you out after a long session. Sign in again to continue."
Primary:    "Sign In"
```

### Sync Conflict (Class D)
```
Headline:   "We found a conflict"
Body:       "Your changes and the server's version are different. Which would you like to keep?"
Primary:    "Keep my version"
Secondary:  "Use server version"
```

### Payment / Premium Error
```
Headline:   "Something went wrong with billing"
Body:       "We couldn't process your payment. Your subscription is still active."
Primary:    "Update payment method"
Secondary:  "Contact support"
```

---

## Tone Reference

| Wrong | Right |
|---|---|
| "Error 503: Service Unavailable" | "Something went wrong on our end" |
| "You must enable location services" | "We need your location to show accurate prayer times" |
| "Failed to load" | "Couldn't load right now" |
| "Invalid input" | "That doesn't look quite right" |
| "Request timed out after 30000ms" | "Taking longer than expected" |
| "Network error: fetch failed" | "Couldn't connect right now" |
| "You haven't set up your profile" | "Add your name to personalise your experience" |
| "You are not authorised" | "You'll need to sign in to see this" |
| "Database error occurred" | "Something went wrong on our end" |

---

## Error in Hebrew / Bilingual Context

When the app is in Turkmen or when a user's language is set to a non-English language:
- All error messages are delivered in the user's selected language via `LanguageContext`.
- Never show an error in English only when the user has selected Turkmen.
- Translation keys for all error messages must exist in `translations.ts` before shipping.
  Format: `errorNetwork`, `errorTimeout`, `errorServer`, `errorNotFound`, `errorPermission`, etc.

---

## What Never to Do

| Pattern | Why |
|---|---|
| Show raw error objects or stack traces | Exposes implementation details; scares users |
| Use `Alert.alert()` for non-critical errors | Blocks the entire UI unnecessarily |
| Show errors in red text inline without structure | Easy to miss; no recovery path |
| Auto-dismiss an error without user acknowledgement (Class C+) | User may not have seen it |
| Show multiple error toasts simultaneously | Overwhelming; queue them instead |
| Use the word "crash" | Alarmist; erodes trust |
| Use the word "failed" alone without context | Cold and unhelpful |
| Say "Please try again" | "Please" sounds automated; say "Try again" directly |
