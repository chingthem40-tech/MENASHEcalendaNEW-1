---
name: Memorial backend V1 architecture
description: Key structural decisions for the SPR-013 memorial backend — schema location, migration strategy, enum creation pattern, and route mounting.
---

## Schema location
All 8 Drizzle ORM schemas live in `lib/db/src/schema/memorial.ts`, exported via `lib/db/src/schema/index.ts`. UUID PKs with `.defaultRandom()`, all timestamps use `{ withTimezone: true }`.

## Migration strategy
The project uses raw SQL in `artifacts/api-server/src/migrate.ts` (not Drizzle Kit push at runtime). New tables are added as `CREATE TABLE IF NOT EXISTS` blocks. They run at server startup.

## Enum creation
PostgreSQL enums must each be created in a **separate** `client.query()` call with one `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` block. Multiple DO blocks in a single query() call fail.

## Repository / service layout
```
artifacts/api-server/src/memorial/
  repositories/  MemorialRepository, CandleRepository, TributeRepository, PhotoRepository, FamilyRepository
  services/      MemorialService, CandleService, TributeService
  index.ts       barrel export
```

## Route mounting
Routes registered as `router.use(memorialsRouter)` in `routes/index.ts` (no prefix). The Express app already mounts the router at `/api` via `app.use("/api", router)` in `app.ts`. Adding a `/api` prefix in routes/index.ts would double the prefix.

## Drizzle sql() counter pattern
Use `sql\`(SELECT COUNT(*) FROM ${table} WHERE col = ${val})\`` for subquery counter updates. `db.$count()` returns a Promise, not a number — cannot be used inline in `.set({})`.

**Why:** These are the non-obvious pitfalls that caused build failures during implementation; future memorial-domain work should follow these conventions.
