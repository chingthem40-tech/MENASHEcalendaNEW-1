---
name: Legacy JSON schedule expansion
description: PostgreSQL compatibility rule for migrating legacy push-subscription schedule arrays into normalized rows.
---

When expanding legacy schedule arrays with a lateral JSON function, explicitly cast each yielded value to `jsonb`. Inside string concatenation, wrap the complete `->>` extraction in parentheses rather than only parenthesizing the cast.

**Why:** Existing databases can expose the lateral value with a text type, and PostgreSQL operator precedence can otherwise apply `->>` to the concatenated text expression. Both cases produce the misleading `operator does not exist: text ->> unknown` startup failure.

**How to apply:** Use this rule in compatibility/backfill migrations that read the historical subscription schedule field. Keep new normalized queue writes independent of the legacy JSON representation.