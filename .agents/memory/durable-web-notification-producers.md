---
name: Durable web notification producers
description: Transactional rule for coupling persisted domain events to the web notification queue.
---

Any persisted domain event that produces a web notification must create its queue jobs in the same PostgreSQL transaction, or use a separately durable outbox/reconciler. A best-effort enqueue after commit is not sufficient.

**Why:** Stable idempotency keys prevent duplicate jobs, but they do not prevent permanent notification loss if the process stops between committing the domain event and inserting its jobs.

**How to apply:** Let queue fanout helpers accept the active transaction client. Use a collision-resistant persisted occurrence ID as the queue source identity, commit domain state and queue rows together, and defer non-transactional provider work until after commit.