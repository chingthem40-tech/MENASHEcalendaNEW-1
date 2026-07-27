# Coding Standards

> Purpose: Define and enforce consistent coding conventions across all packages in the Menashe Platform monorepo.
> Last updated: 2026-06-26 (SPR-001)

---

## Language & Runtime

- **TypeScript 5.9** — strict mode required for all new code
- **Node.js 20** — minimum engine version
- **ESM modules** — all packages use `"type": "module"`; no CommonJS `require()`

---

## TypeScript Standards

- `strict: true` in all `tsconfig.json` files
- **No `any`** — currently 185 uses in the codebase; new code must not add any; existing `any` should be eliminated progressively
- Use `unknown` instead of `any` for untyped external data; narrow explicitly
- Use `zod` for all runtime validation of external input (API request bodies, environment variables)
- Prefer `type` over `interface` for object shapes unless extension is needed
- Export types from a dedicated `types.ts` in each module; do not export types from implementation files

---

## File Size Limits

- **Maximum 400 lines per file** — anything approaching this limit is a signal to extract sub-components or utilities
- Exceptions: generated files, translation dictionaries, static data maps
- The current violations (Home.tsx at 5,206 lines, CensusModal at 2,298 lines, etc.) are tracked in the Technical Debt Register

---

## Component Standards (React)

- **One component per file** — no multi-export component files
- **Prefer function components** — no class components
- Apply `React.memo()` to any component that receives stable props and renders frequently
- Apply `useMemo()` for expensive derived values (Hebrew calendar calculations, zmanim)
- Apply `useCallback()` for functions passed as props to memoized children
- **Never hardcode strings** — all UI text must go through `useLanguage()` / `t.xxx`; both EN and TK translations must be added to `translations.ts`

---

## State Management Rules

- **Local UI state** (open/close, form fields) → `useState` in the component
- **Shared session state** (theme, location, language, premium) → Context
- **Server data** → React Query (web and mobile); do not mix with `useEffect + fetch`
- **Persistence** → `localStorage` (web) or `AsyncStorage` (mobile); never `sessionStorage` for anything security-relevant
- **Modal visibility** — must NOT live in the root `App.tsx`; use a dedicated modal manager hook or Zustand slice (tracked as TD-003)

---

## API & Data Fetching

- All API calls must go through the `apiFetch()` helper which attaches the Clerk JWT
- Use the generated hooks in `lib/api-client-react` — do not write new raw `fetch` calls for endpoints covered by the OpenAPI spec
- All new API endpoints must be defined in `lib/api-spec/openapi.yaml` first, then run `pnpm --filter @workspace/api-spec run codegen`
- Server-side route handlers must validate request bodies with generated Zod schemas from `lib/api-zod`

---

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Components | PascalCase | `CalendarPage.tsx` |
| Hooks | camelCase with `use` prefix | `useZmanim.ts` |
| Utilities | camelCase | `hebrewCalendar.ts` |
| Types | PascalCase | `type ZmanimResult` |
| Constants | SCREAMING_SNAKE | `MAX_VIRTUAL_FLOWERS` |
| API routes | kebab-case paths | `/api/community-yahrzeit` |
| DB tables | snake_case | `yahrzeit_entries` |
| ENV vars | SCREAMING_SNAKE | `CLERK_SECRET_KEY` |

---

## Security Rules

- **No hardcoded secrets** — use `process.env.VAR_NAME`; request missing secrets via `requestEnvVar`
- **No secret values in `VITE_*` vars** — anything prefixed `VITE_` is shipped to the browser
- Every new protected route must use `requireAuth` middleware
- Every admin route must use both `requireAuth` AND a role check (PIN-only is deprecated — see TD-001)
- All `JSONB` column values must be validated with Zod before DB insert
- New object storage access must verify file ownership before serving

---

## Git & PR Standards (aspirational — to be enforced in SPR-002)

- One logical change per commit; conventional commit format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- PRs must pass `pnpm run typecheck` before review
- No PR merges that increase the `any` count above current baseline (185)
- New API endpoints require OpenAPI spec update in the same PR

---

## Testing Standards (aspirational — see Production Readiness Checklist)

- Unit tests for all calendar/zmanim calculations
- Integration tests for all API routes
- E2E tests for the three core user flows: sign-in, view today's Zmanim, Siddur read
- 3D scene tested via snapshot/visual regression in a headless environment
