---
name: MMDL hook tokens in StyleSheet
description: Why sp/rd/type from useThemeTokens() crash inside StyleSheet.create(), the fix, and the ESLint guard that prevents recurrence.
---

## The rule
Never use `sp[n]`, `rd[n]`, or `type.*` inside `StyleSheet.create()`. Use numeric literals.

**Why:** `StyleSheet.create()` is called at **module load time** — before any React component mounts and before any hook can run. `sp`, `rd`, and `type` are returned by `useThemeTokens()`, a React hook. Referencing them at module level throws `ReferenceError: sp is not defined` and crashes the entire screen on startup.

**How to apply:** When migrating `SPACE[n]` → `sp[n]` with a `replace_all`, the replacement sweeps the entire file including the static `StyleSheet.create()` block. Always scope bulk replacements to the JSX/component body range only (lines before the `StyleSheet.create(` call), or run a line-range sed/Python substitution. After migrating, verify with:
```
grep -n 'sp\[' <file> | awk -F: '$1 >= <stylesheet_start_line>'
```

## Numeric equivalents (standard 4pt scale)
| Token | Value |
|---|---|
| sp[1] | 4 |
| sp[2] | 8 |
| sp[3] | 12 |
| sp[4] | 16 |
| sp[5] | 20 |
| sp[6] | 24 |
| sp[8] | 32 |

## ESLint guard
`artifacts/menashe-mobile/.eslintrc.js` — `no-restricted-syntax` rule with three AST selectors:
- `CallExpression[callee.object.name='StyleSheet'][callee.property.name='create'] MemberExpression[object.name='sp']`
- Same for `rd` and `type`

Run with: `pnpm --filter @workspace/menashe-mobile lint`
