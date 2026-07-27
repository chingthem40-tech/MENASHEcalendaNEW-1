---
name: Mobile Metro @/ alias
description: How to ensure the @/ path alias resolves reliably in the Expo mobile monorepo
---

The `@/` path alias (pointing to the menashe-mobile package root) is declared in `tsconfig.json` `paths`, but `babel-preset-expo` alone is insufficient in the pnpm monorepo — Metro invalidates its transform cache when `metro.config.js` changes, causing fresh resolution to fail.

**Rule:** Always declare the alias explicitly in `metro.config.js` via `config.resolver.alias`:

```js
config.resolver.alias = {
  "@": path.resolve(__dirname),
};
```

**Why:** After any `metro.config.js` change Metro starts a fresh resolution pass. Without the explicit alias in the resolver, `@/lib/...` imports fail with "Unable to resolve" even though the files exist, because babel-preset-expo's tsconfig path handling only kicks in during the Babel transform step, which runs after Metro resolver.

**How to apply:** Any time metro.config.js is modified, verify `config.resolver.alias` is still present. This is already in the current config.
