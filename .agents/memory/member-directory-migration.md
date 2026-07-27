---
name: Member Directory server migration
description: localStorage-to-DB migration pattern for the web Member Directory, now shared with mobile; DO $$ dollar-quoting gotcha in migrate.ts.
---

- The web app's Member Directory was originally 100% localStorage — no backend at all. It's now a real `member_directory` table (one row per Clerk `user_id`, unique), exposed via `artifacts/api-server/src/routes/directory.ts` and consumed by both the web modal and mobile screens through separate thin API clients (`directoryApi.ts` in each app).
- Convention followed: Drizzle schema file in `lib/db/src/schema/` for types/zod only; actual `CREATE TABLE`/`CREATE TYPE` DDL lives in `artifacts/api-server/src/migrate.ts` as raw `pool.query` — matches the `census.ts` precedent, not the fuller repo/service layer used by `memorial.ts`.
- **Gotcha:** in `migrate.ts`, Postgres `DO $$ ... $$` blocks must use a real dollar-quote tag (e.g. `$$` or `$tag$`), not a bare single `$`. A bare `$` produces a cryptic `syntax error at or near "$"` from the `pg` driver that looks unrelated to dollar-quoting — check for this first if a migration string with `DO $...$` fails.
- After editing `migrate.ts` or any api-server source, the dev workflow's start script only rebuilds if `dist/index.mjs` is *missing* (`test -f dist/index.mjs && start || (build && start)`) — restarting the workflow alone will NOT pick up source changes if the old dist still exists. Must `rm -f dist/index.mjs` (or otherwise force a rebuild) before restarting to actually test new server code.
