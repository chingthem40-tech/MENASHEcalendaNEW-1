---
name: Express 5 req.params types
description: Express 5 types req.params and req.headers values as string | string[], causing TypeScript errors when passing to parseInt or SQL parameters.
---

## Rule
Always wrap `req.params.id` / `req.params.userId` with `String()` before using in `parseInt()` or SQL queries.

**Why:** Express 5 `@types/express` widens `req.params` dictionary values to `string | string[]` (matching Express 5's actual runtime behavior where repeated path params can theoretically be arrays). This breaks TypeScript strict mode when you try to pass the value to `parseInt(x)` or `pool.query(..., [x])` that expect `string`.

**How to apply:**
- `parseInt(req.params.id)` → `parseInt(String(req.params.id))`
- `const { id } = req.params` → `const id = String(req.params.id)`
- Same pattern for `req.params.userId`, `req.params.entryId`, etc.
- Also applies to `req.headers['x-admin-pin']` which is `string | string[] | undefined`.
