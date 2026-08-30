---
name: Autoscale startup DDL
description: Why database schema mutation must not run before HTTP ports open in Replit multi-artifact Autoscale deployments.
---

## Rule
Do not run `CREATE`, `ALTER`, index creation, or other schema mutation from the production application entrypoint before opening its HTTP port. Keep schema updates in the development bootstrap/source of truth and let Replit's Publish flow synchronize production.

**Why:** Multi-artifact Autoscale waits for every runnable artifact port. A startup DDL query that blocks on the production database prevents the API port from opening, causing repeated health-check 500s and a publish timeout even though all bundles compiled successfully.

**How to apply:** Keep idempotent schema setup in the development bootstrap, verify production schema read-only when debugging, and make the production entrypoint bind promptly before starting ordinary background work.