#!/bin/bash
VITE_BIN=$(ls /home/runner/workspace/node_modules/.pnpm/vite@*/node_modules/vite/bin/vite.js 2>/dev/null | head -1)
if [ -z "$VITE_BIN" ]; then
  echo "ERROR: vite binary not found" >&2
  exit 1
fi
exec node "$VITE_BIN" --config /home/runner/workspace/artifacts/menashe-calendar/vite.config.ts --host 0.0.0.0
