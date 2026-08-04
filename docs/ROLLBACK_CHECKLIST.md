# Menashe Platform — Rollback Checklist

Use when a production deployment needs to be reverted.

---

## When to Roll Back

- Startup migration fails (API server exits with migration error)
- `/health` endpoint returns non-200 for more than 2 minutes
- Critical user-facing flows broken (cannot sign in, calendar fails to load)
- Data corruption detected

---

## Rollback Steps

### 1. Immediate (< 5 minutes)

1. Open the Replit workspace
2. Click the **Checkpoints** button in the left panel
3. Select the last known-good checkpoint
4. Click **Restore** — this reverts all source files to that checkpoint
5. Trigger a new deployment from the restored state

### 2. Database Schema Rollback

The API server uses **additive-only migrations** (ALTER TABLE ADD COLUMN IF NOT EXISTS). Columns are never dropped automatically.

If a new column caused a problem:
```sql
-- Connect to the production database (read the database skill)
-- Manually drop the offending column:
ALTER TABLE feedback DROP COLUMN IF EXISTS <column_name>;
```

Only do this if you know exactly which column caused the issue.

### 3. Secrets Rollback

If a secret rotation caused the issue:
1. Restore the previous secret value in Replit Secrets
2. Redeploy

### 4. Verify Rollback Success

- [ ] `/health` returns `{"status":"ok"}`
- [ ] Startup logs show `Schema ready`
- [ ] Landing page loads
- [ ] Sign In works
- [ ] Calendar displays for a test user

---

## Data Recovery

Replit's built-in PostgreSQL database is snapshotted with checkpoints. If data was corrupted:

1. Identify the timestamp of the last good data
2. Contact Replit support if a DB-level restore is needed
3. For application-level recovery, query records with `created_at` ranges to identify affected data

---

## Contact

Platform issues: file a bug report via Feedback Center or email the platform administrator.
