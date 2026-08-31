#!/bin/bash
set -euo pipefail

# Keep the merge hook fully non-interactive. `drizzle-kit push` can open a
# schema-diff prompt in a closed-stdin environment; the API bootstrap uses the
# project's idempotent migrations instead.
CI=1 pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run db:bootstrap
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/menashe-calendar run build
