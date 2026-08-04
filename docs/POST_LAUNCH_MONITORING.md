# Menashe Platform — Post-Launch Monitoring Checklist

---

## Day 1 (First 24 Hours)

### Health Checks (every 30 minutes)
- [ ] `GET /health` returns `{"status":"ok"}` within 500ms
- [ ] No ERROR-level log entries in API server logs
- [ ] No 5xx responses in API server request log

### User Flows (check manually after launch)
- [ ] New user can sign up
- [ ] Existing user can sign in
- [ ] Calendar loads with correct date for a test location
- [ ] Announcements page loads
- [ ] Community Yahrzeit page loads
- [ ] Feedback Center submits a test bug report successfully (check DB for reference number)

### API Server
- [ ] Startup log shows `Schema ready` (migrations applied)
- [ ] No `WARN` entries other than known missing-config warnings
- [ ] Requests are completing within expected time (< 2s for most routes)

---

## Week 1

### Performance
- [ ] Monitor API response times — P95 should be < 1s for data routes
- [ ] Check rate limiter 429 frequency — sudden spikes indicate abuse or mis-configuration
- [ ] Monitor push subscription count (GET `/api/push/subscriber-count` as admin)

### Data Integrity
- [ ] Verify feedback submissions are being created with reference numbers
- [ ] Verify announcements can be broadcast and received
- [ ] Verify community yahrzeit entries are persisting

### Errors
- [ ] Review any 500 errors in logs — triage and hotfix if recurring
- [ ] Review any 401 spikes — may indicate Clerk key rotation needed
- [ ] Check for any unexpected CORS rejections

---

## Monthly

### Security
- [ ] Review admin panel for any suspicious activity (audit log)
- [ ] Check for pending premium requests in admin panel
- [ ] Verify push notification delivery rate

### Content
- [ ] Review feedback submissions and triage P0/P1 items
- [ ] Review member directory moderation queue
- [ ] Check census branch submissions for completeness

### Maintenance
- [ ] Bump `APP_VERSION` in `whatsNewVersion.ts` if releasing updates
- [ ] Review and rotate secrets if any exposure risk
- [ ] Check Clerk dashboard for any failed authentication events

---

## Alerts to Set Up

| Condition | Threshold | Action |
|---|---|---|
| `/health` non-200 | > 2 consecutive failures | Page on-call, investigate |
| 5xx rate | > 1% of requests | Investigate logs, consider rollback |
| 429 rate | > 5% of requests | Check for abuse, review rate limits |
| DB connection errors | Any | Check DB health, restart if needed |
| Migration failure | Any at startup | Roll back immediately |

---

## Log Monitoring

The API server uses structured JSON logging via Pino. Key log fields:

- `level: "error"` — requires immediate attention
- `level: "warn"` — review within 24 hours
- `req.url`, `res.statusCode` — per-request details
- `event: "admin.*"` — audit log entries for admin actions

Useful queries (grep on log stream):
```bash
# All errors
grep '"level":50' api.log

# All 5xx responses
grep '"statusCode":5' api.log

# Admin actions
grep 'admin\.' api.log

# Rate limit hits
grep '"statusCode":429' api.log
```
