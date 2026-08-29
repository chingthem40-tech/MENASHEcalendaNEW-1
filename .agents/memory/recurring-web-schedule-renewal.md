---
name: Recurring web schedule renewal
description: Durable rule for keeping browser push reminder occurrences populated without requiring the app to reopen.
---

Recurring browser reminder schedules must persist a validated recurrence configuration and regenerate future queue occurrences on the server before the current horizon expires. The browser and server must use the same pure schedule generator.

**Why:** A browser can submit concrete future occurrences when preferences change, but it cannot be relied on to reopen before those occurrences run out. Copying old timestamps forward would also make timezone, DST, holiday, and solar-time reminders inaccurate.

**How to apply:** Treat the saved configuration as the renewal source of truth, use row locking so concurrent API instances do not renew the same subscription together, and retain idempotent occurrence keys when replacing pending jobs.