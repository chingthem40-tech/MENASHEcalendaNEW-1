#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# ── Clerk key guard ──────────────────────────────────────────────────────────
# VITE_CLERK_PUBLISHABLE_KEY must be set before the web app can start.
# If it's missing, Clerk hasn't been provisioned yet — the agent must run
# setupClerkWhitelabelAuth() in its code_execution sandbox to provision it.
if [ -z "$VITE_CLERK_PUBLISHABLE_KEY" ]; then
  echo ""
  echo "┌──────────────────────────────────────────────────────────────────────┐"
  echo "│  ⚠️  CLERK NOT PROVISIONED                                           │"
  echo "│                                                                      │"
  echo "│  VITE_CLERK_PUBLISHABLE_KEY is not set.                              │"
  echo "│  Ask the Replit agent: 'provision Clerk' to fix this.                │"
  echo "└──────────────────────────────────────────────────────────────────────┘"
  echo ""
  exit 1
fi
