---
name: Memorial Sanctuary — no fabricated data policy
description: What was removed and what the rule is going forward for Memorial Sanctuary stats and activity.
---

# Memorial Sanctuary: No Fabricated Data

## What was removed (SPR-035 T001)
- `hashNum()` — fake number generator seeded on entry IDs
- `NOTIF_NAMES`, `NOTIF_CITIES`, `buildNotifText()` — fake "Sarah from Jerusalem lit a candle" activity
- Ambient notification timer firing fake popups every 28–46s
- Fake global base stats: 24832 candles, 8947 flowers, `totalVisitors`
- Per-memorial fake `candleN`, `flowerN`, `visitorN` stats
- Fake birth year computed from hash-derived age

## What replaced them
- `EntranceCard`: real `entries.length` as candle count, or honest "No recent activity yet."
- `StatsChipRow`: single chip — real DB candle count only
- `MemorialProfileSheet`: Life Timeline shows only real year of passing; no stats grid
- `AmbientNotification`: returns `null` — preserved as stub for a real WebSocket stream

## Rule going forward
**Never put fabricated counts, names, or engagement signals in the Memorial Sanctuary.**
Real data or honest empty state. See `docs/ExperienceGuidelines.md` § "Truth & Trust".
