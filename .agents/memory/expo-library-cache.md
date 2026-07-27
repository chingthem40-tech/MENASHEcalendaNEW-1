---
name: Expo Library cache refresh
description: Development Expo previews can keep serving an older Library screen after source edits
---

When validating mobile Library UI changes in the Expo web preview, restart the managed Expo workflow with Metro cache clearing enabled before judging the rendered screen.

**Why:** The preview can display an older route bundle even while the current source and server-generated bundle contain the new Library layout, making valid UI changes appear not to have applied.

**How to apply:** Keep the mobile dev workflow's Expo start command on `--clear`, restart after Library UI edits, and reopen or hard-refresh the device/browser preview.