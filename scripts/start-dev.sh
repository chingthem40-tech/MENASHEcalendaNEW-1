#!/bin/bash
set -e

pnpm install --frozen-lockfile

# Start API server in background
pnpm --filter @workspace/api-server run dev &
API_PID=$!

# Start frontend (blocks)
pnpm --filter @workspace/menashe-calendar run dev &
FRONTEND_PID=$!

# Wait for either to exit
wait $API_PID $FRONTEND_PID
