---
name: hebcal-noaa ESM shim
description: How to fix @hebcal/noaa pure-ESM build failures in Metro production bundles for the Menashe Calendar mobile app
---

## The rule
`@hebcal/noaa@0.11.0` ships ONLY pure ESM (`export class`, top-level `await import(...)`) with no CJS fallback. Metro skips Babel transformation for node_modules by default, so the raw ESM goes straight to Terser during production builds (`minify=true`) and fails with `Unexpected token: name (r)`.

**Fix in place:** `artifacts/menashe-mobile/metro.config.js` uses `config.resolver.resolveRequest` to redirect any import of `@hebcal/noaa` to a pre-compiled CJS shim at `artifacts/menashe-mobile/shims/hebcal-noaa-cjs.js`.

**Why:**
- `transformIgnorePatterns` regex fix does NOT work in pnpm because packages live at `.pnpm/@hebcal+noaa@.../node_modules/@hebcal/noaa/` — the regex matches at the first `node_modules/.pnpm` boundary, not the actual package.
- Custom `minifierPath` override does NOT work in `@expo+metro-config@54.0.16` — the minifierConfig is not threaded through to the worker correctly.
- The `resolveRequest` redirect is reliable and bypasses both issues entirely.

**How to apply:**
- If `@hebcal/noaa` is upgraded, re-run the shim generation script:
  ```bash
  node -e "
  const babel = require('/home/runner/workspace/node_modules/.pnpm/@babel+core@7.29.7/node_modules/@babel/core');
  const transformModules = require('/home/runner/workspace/node_modules/.pnpm/@babel+plugin-transform-modules-commonjs@7.29.7_@babel+core@7.29.7/node_modules/@babel/plugin-transform-modules-commonjs');
  const src = require('fs').readFileSync('/home/runner/workspace/node_modules/.pnpm/@hebcal+noaa@0.11.0/node_modules/@hebcal/noaa/dist/index.js', 'utf8');
  const stripped = src.replace(/if \(typeof globalThis\.Temporal === 'undefined'\) \{[\s\n\r]*await import\('temporal-polyfill\/global'\);[\s\n\r]*\}/, '/* Temporal polyfill handled by @hebcal\/core */');
  const result = babel.transformSync(stripped, { configFile: false, babelrc: false, plugins: [transformModules], filename: 'index.js', sourceType: 'module' });
  require('fs').writeFileSync('/home/runner/workspace/artifacts/menashe-mobile/shims/hebcal-noaa-cjs.js', result.code);
  "
  ```
- Other pure-ESM node_modules packages with the same issue can be fixed the same way (add to resolveRequest, add shim).
