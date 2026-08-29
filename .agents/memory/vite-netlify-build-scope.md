---
name: Netlify-only Vite configuration
description: Prevent Netlify-specific build validation from breaking Replit production artifact builds.
---

**Rule:** Netlify redirect generation and `NETLIFY_API_URL` validation must run only when Netlify identifies the build, or when the variable is explicitly supplied for local Netlify validation.

**Why:** Replit static artifact builds also run Vite in production mode. Treating every production build as Netlify aborts Replit Publishing before Rollup even starts.

**How to apply:** Keep framework-wide production checks independent. Gate host-specific redirect generation on that host's environment signal, while preserving strict validation when the host-specific path is active.