import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import { logger } from "./lib/logger";

const SEED_BOOKS = [
  {
    title: "Siddur Ashkenaz",
    language: "Hebrew / English",
    category: "Siddur",
    description:
      "The complete Ashkenazic prayer book for weekdays, Shabbat, and holidays with Hebrew text and English translation.",
    cover_emoji: "🕍",
    cover_color: "#1a3050",
    file_url: "https://www.sefaria.org/sheets/print",
    is_premium: false,
    published: true,
    sort_order: 1,
  },
  {
    title: "Tehillim — Psalms",
    language: "Hebrew / English",
    category: "Tehillim",
    description:
      "The complete Book of Psalms (Tehillim) with Hebrew text, transliteration, and English translation. Essential daily reading.",
    cover_emoji: "📜",
    cover_color: "#2a1a40",
    file_url: null,
    is_premium: false,
    published: true,
    sort_order: 2,
  },
  {
    title: "Parashat HaShavua",
    language: "Hebrew / English",
    category: "Torah Portions",
    description:
      "Complete weekly Torah portions with commentary and Haftarah readings for the entire year.",
    cover_emoji: "📖",
    cover_color: "#1a2a20",
    file_url: null,
    is_premium: false,
    published: true,
    sort_order: 3,
  },
  {
    title: "Siddur Sefard",
    language: "Hebrew",
    category: "Siddur",
    description:
      "The Sefardic prayer rite, used by many Bnei Menashe communities and Mizrachi congregations.",
    cover_emoji: "🌟",
    cover_color: "#30200a",
    file_url: null,
    is_premium: true,
    published: true,
    sort_order: 4,
  },
  {
    title: "Mishna Yomit",
    language: "Hebrew / English",
    category: "Daily Study",
    description:
      "One Mishna per day — complete Shisha Sidrei Mishna cycle with commentary.",
    cover_emoji: "📚",
    cover_color: "#1a1a30",
    file_url: null,
    is_premium: true,
    published: true,
    sort_order: 5,
  },
  {
    title: "Hebrew Alef-Bet Primer",
    language: "English",
    category: "Hebrew Learning",
    description:
      "Beginner guide to reading and writing Hebrew — letters, vowels, and basic words for Bnei Menashe newcomers.",
    cover_emoji: "🔤",
    cover_color: "#0a2030",
    file_url: null,
    is_premium: false,
    published: true,
    sort_order: 6,
  },
  {
    title: "Bnei Menashe Prayer Guide",
    language: "Kuki / Hebrew",
    category: "Kuki Christian Books",
    description:
      "Traditional prayers and liturgy adapted for Bnei Menashe communities transitioning to Jewish observance.",
    cover_emoji: "🙏",
    cover_color: "#2a1030",
    file_url: null,
    is_premium: false,
    published: true,
    sort_order: 7,
  },
  {
    title: "Shabbat Table Songs",
    language: "Hebrew / Transliteration",
    category: "Prayer Books",
    description:
      "Complete Zemirot for Friday night and Shabbat day — songs, melodies, and traditions of Bnei Menashe.",
    cover_emoji: "🎵",
    cover_color: "#1a2a10",
    file_url: null,
    is_premium: false,
    published: true,
    sort_order: 8,
  },
];

export async function ensureRecurringWebScheduleSchema(
  db: Pick<PoolClient, "query"> = pool,
): Promise<void> {
  await db.query(`
    ALTER TABLE push_subscriptions
      ADD COLUMN IF NOT EXISTS schedule_config JSONB,
      ADD COLUMN IF NOT EXISTS schedule_horizon_until TIMESTAMPTZ
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS push_subscriptions_schedule_renewal_idx
      ON push_subscriptions (schedule_horizon_until)
      WHERE schedule_config IS NOT NULL
  `);
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info("Running startup migrations…");

    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id           SERIAL PRIMARY KEY,
        title        TEXT NOT NULL,
        language     TEXT NOT NULL DEFAULT 'English',
        category     TEXT NOT NULL,
        description  TEXT NOT NULL DEFAULT '',
        cover_emoji  TEXT NOT NULL DEFAULT '📖',
        cover_color  TEXT NOT NULL DEFAULT '#1a2540',
        file_url     TEXT,
        is_premium   BOOLEAN NOT NULL DEFAULT false,
        published    BOOLEAN NOT NULL DEFAULT true,
        sort_order   INTEGER NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Public member profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_public_profiles (
        user_id       TEXT PRIMARY KEY,
        display_name  TEXT NOT NULL DEFAULT '',
        congregation  TEXT NOT NULL DEFAULT '',
        bio           TEXT NOT NULL DEFAULT '',
        role          TEXT NOT NULL DEFAULT 'Member',
        city          TEXT NOT NULL DEFAULT '',
        country       TEXT NOT NULL DEFAULT '',
        avatar_emoji  TEXT NOT NULL DEFAULT '👤',
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // User profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id       TEXT PRIMARY KEY,
        theme         TEXT NOT NULL DEFAULT 'dark',
        location      JSONB,
        is_premium    BOOLEAN NOT NULL DEFAULT false,
        candle_enabled BOOLEAN NOT NULL DEFAULT true,
        language      TEXT NOT NULL DEFAULT 'en',
        notif_prefs   JSONB,
        lead_time     INTEGER NOT NULL DEFAULT 10,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Yahrzeit entries
    await client.query(`
      CREATE TABLE IF NOT EXISTS yahrzeit_entries (
        id              TEXT NOT NULL,
        user_id         TEXT NOT NULL,
        name            TEXT NOT NULL,
        hebrew_day      INTEGER NOT NULL,
        hebrew_month    INTEGER NOT NULL,
        display_date    TEXT NOT NULL,
        was_after_sunset BOOLEAN NOT NULL DEFAULT false,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, id)
      )
    `);

    // Torah tracker entries
    await client.query(`
      CREATE TABLE IF NOT EXISTS torah_tracker_entries (
        id          TEXT NOT NULL,
        user_id     TEXT NOT NULL,
        date        TEXT NOT NULL,
        subject     TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        duration    INTEGER NOT NULL DEFAULT 0,
        notes       TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, id)
      )
    `);

    // Torah tracker goals
    await client.query(`
      CREATE TABLE IF NOT EXISTS torah_tracker_goals (
        user_id   TEXT PRIMARY KEY,
        goal_mins INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Community Yahrzeit Board
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_yahrzeit (
        id                  TEXT PRIMARY KEY,
        user_id             TEXT NOT NULL,
        deceased_name       TEXT NOT NULL,
        hebrew_day          INTEGER NOT NULL,
        hebrew_month        INTEGER NOT NULL,
        display_date        TEXT NOT NULL DEFAULT '',
        passing_year        INTEGER,
        message             TEXT NOT NULL DEFAULT '',
        candle_lit          BOOLEAN NOT NULL DEFAULT false,
        candle_lit_by       TEXT,
        candle_lit_at       TIMESTAMPTZ,
        donor_display_name  TEXT NOT NULL DEFAULT '',
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Active learning dedications (text floats in candle flame for 5 min)
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_yahrzeit_learners (
        id            TEXT PRIMARY KEY,
        entry_id      TEXT NOT NULL,
        user_id       TEXT NOT NULL,
        learner_name  TEXT NOT NULL DEFAULT '',
        study_subject TEXT NOT NULL DEFAULT '',
        active_until  TIMESTAMPTZ NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Push notification subscriptions (persistent across restarts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id          TEXT PRIMARY KEY,
        endpoint    TEXT NOT NULL,
        p256dh      TEXT NOT NULL,
        auth        TEXT NOT NULL,
        schedule    JSONB NOT NULL DEFAULT '[]',
        added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Census — local admin's branch (one per authenticated user)
    await client.query(`
      CREATE TABLE IF NOT EXISTS census_branches (
        id              TEXT PRIMARY KEY,
        owner_user_id   TEXT NOT NULL UNIQUE,
        name            TEXT NOT NULL,
        city_id         TEXT NOT NULL DEFAULT '',
        city_name       TEXT NOT NULL DEFAULT '',
        admin_name      TEXT,
        established     TEXT,
        logo_url             TEXT,
        synagogue_image_url  TEXT,
        families        JSONB NOT NULL DEFAULT '[]',
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Add logo_url / synagogue_image_url to census_branches (idempotent, for pre-existing tables)
    await client.query(`
      ALTER TABLE census_branches ADD COLUMN IF NOT EXISTS logo_url TEXT
    `);
    await client.query(`
      ALTER TABLE census_branches ADD COLUMN IF NOT EXISTS synagogue_image_url TEXT
    `);
    // DATA-701: leadership roles + branch operational status (idempotent)
    await client.query(`
      ALTER TABLE census_branches ADD COLUMN IF NOT EXISTS leadership JSONB
    `);
    await client.query(`
      ALTER TABLE census_branches ADD COLUMN IF NOT EXISTS branch_status TEXT NOT NULL DEFAULT 'active'
    `);

    // DATA-702: change new branch default from 'active' to 'draft' (idempotent — ALTER DEFAULT does not affect existing rows)
    await client.query(`
      ALTER TABLE census_branches ALTER COLUMN branch_status SET DEFAULT 'draft'
    `);

    // DATA-702: immutable review-event audit trail for branch lifecycle
    await client.query(`
      CREATE TABLE IF NOT EXISTS branch_review_events (
        id            TEXT PRIMARY KEY,
        branch_id     TEXT NOT NULL REFERENCES census_branches(id) ON DELETE CASCADE,
        actor_user_id TEXT NOT NULL,
        actor_role    TEXT NOT NULL,          -- 'local_admin' | 'regional_admin' | 'national_admin'
        action        TEXT NOT NULL,          -- 'created' | 'submitted' | 'approved' | 'rejected' | 'activated' | 'suspended' | 'archived' | 'restored' | 'changes_requested'
        from_status   TEXT,
        to_status     TEXT NOT NULL,
        note          TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS branch_review_events_branch_idx ON branch_review_events (branch_id, created_at DESC)
    `);

    // DATA-702: admin role assignments (regional / national beyond Clerk org:admin)
    await client.query(`
      CREATE TABLE IF NOT EXISTS branch_admin_roles (
        user_id     TEXT PRIMARY KEY,
        role        TEXT NOT NULL,    -- 'regional_admin' | 'national_admin'
        assigned_by TEXT NOT NULL,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Census — branch submissions for global admin review
    await client.query(`
      CREATE TABLE IF NOT EXISTS census_submissions (
        id              TEXT PRIMARY KEY,
        owner_user_id   TEXT NOT NULL,
        branch_data     JSONB NOT NULL,
        status          TEXT NOT NULL DEFAULT 'pending',
        submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_at     TIMESTAMPTZ,
        review_note     TEXT
      )
    `);

    // Census — community member submissions to a branch
    await client.query(`
      CREATE TABLE IF NOT EXISTS census_member_submissions (
        id              TEXT PRIMARY KEY,
        branch_id       TEXT NOT NULL,
        branch_name     TEXT NOT NULL,
        submitter_name  TEXT NOT NULL,
        submitter_note  TEXT,
        head_census     JSONB NOT NULL DEFAULT '{}',
        members         JSONB NOT NULL DEFAULT '[]',
        status          TEXT NOT NULL DEFAULT 'pending',
        submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_at     TIMESTAMPTZ,
        review_note     TEXT
      )
    `);

    // Add cover_image_url to books (idempotent)
    await client.query(`
      ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_image_url TEXT
    `);

    // Add profile_photo_url to user_public_profiles (idempotent)
    await client.query(`
      ALTER TABLE user_public_profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT
    `);

    // Add user_id to push_subscriptions (idempotent)
    await client.query(`
      ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_id TEXT
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS push_subs_user_id_idx
        ON push_subscriptions (user_id) WHERE user_id IS NOT NULL
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_uidx
        ON push_subscriptions (endpoint)
    `);
    await ensureRecurringWebScheduleSchema(client);

    // Durable, per-subscription Web Push jobs. Claims use row locks and leases
    // so Replit Autoscale instances can safely process the same queue.
    await client.query(`
      CREATE TABLE IF NOT EXISTS web_notification_jobs (
        id               BIGSERIAL PRIMARY KEY,
        subscription_id  TEXT NOT NULL,
        idempotency_key  TEXT NOT NULL UNIQUE,
        source_type      TEXT NOT NULL,
        source_id        TEXT,
        run_at           TIMESTAMPTZ NOT NULL,
        title            TEXT NOT NULL,
        body             TEXT NOT NULL,
        tag              TEXT NOT NULL,
        icon             TEXT,
        url              TEXT NOT NULL DEFAULT '/',
        timezone         TEXT,
        status           TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','processing','retry','sent','failed')),
        attempts         INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
        max_attempts     INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
        next_attempt_at  TIMESTAMPTZ,
        lease_token      TEXT,
        lease_expires_at TIMESTAMPTZ,
        sent_at          TIMESTAMPTZ,
        last_error       TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Keep sent/failed delivery history when a stale endpoint is removed.
    await client.query(`
      ALTER TABLE web_notification_jobs
        DROP CONSTRAINT IF EXISTS web_notification_jobs_subscription_id_fkey
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS web_notification_jobs_due_idx
        ON web_notification_jobs (COALESCE(next_attempt_at, run_at), id)
        WHERE status IN ('pending','retry')
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS web_notification_jobs_expired_lease_idx
        ON web_notification_jobs (lease_expires_at, id)
        WHERE status = 'processing'
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS web_notification_jobs_source_idx
        ON web_notification_jobs (source_type, source_id, status)
        WHERE source_id IS NOT NULL
    `);

    // Expand valid legacy JSON schedule items once. The old JSON remains in
    // place during rollout; the unique key makes this migration restart-safe.
    await client.query(`
      INSERT INTO web_notification_jobs
        (subscription_id, idempotency_key, source_type, run_at, title, body, tag, icon, url)
      SELECT ps.id,
              'legacy:' || ps.id || ':' || (schedule_item.value->>'tag') || ':' || (schedule_item.value->>'fireAt'),
             'client_schedule',
              to_timestamp((schedule_item.value->>'fireAt')::double precision / 1000.0),
              schedule_item.value->>'title',
              schedule_item.value->>'body',
              schedule_item.value->>'tag',
              COALESCE(schedule_item.value->>'icon', '/favicon.svg'),
              COALESCE(schedule_item.value->>'url', '/')
        FROM push_subscriptions ps
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(ps.schedule) = 'array' THEN ps.schedule ELSE '[]'::jsonb END
        ) AS schedule_item(value)
       WHERE schedule_item.value ? 'fireAt'
         AND schedule_item.value ? 'title'
         AND schedule_item.value ? 'body'
         AND schedule_item.value ? 'tag'
         AND (schedule_item.value->>'fireAt') ~ '^[0-9]+([.][0-9]+)?$'
         AND to_timestamp((schedule_item.value->>'fireAt')::double precision / 1000.0)
               BETWEEN NOW() - INTERVAL '5 minutes' AND NOW() + INTERVAL '95 days'
      ON CONFLICT (idempotency_key) DO NOTHING
    `);

    // Community announcements (server-backed, broadcastable)
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_announcements (
        id           TEXT PRIMARY KEY,
        emoji        TEXT NOT NULL DEFAULT '📢',
        title        TEXT NOT NULL,
        body         TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'sent',
        pinned       BOOLEAN NOT NULL DEFAULT false,
        scheduled_at TIMESTAMPTZ,
        sent_at      TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Expo push tokens (mobile)
    await client.query(`
      CREATE TABLE IF NOT EXISTS expo_push_tokens (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        token       TEXT NOT NULL UNIQUE,
        location    JSONB,
        notif_prefs JSONB,
        lead_mins   INTEGER NOT NULL DEFAULT 15,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS expo_tokens_user_id_idx ON expo_push_tokens (user_id)
    `);

    // Premium access requests
    await client.query(`
      CREATE TABLE IF NOT EXISTS premium_requests (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL UNIQUE,
        status       TEXT NOT NULL DEFAULT 'pending',
        note         TEXT NOT NULL DEFAULT '',
        display_name TEXT,
        avatar_emoji TEXT NOT NULL DEFAULT '👤',
        congregation TEXT,
        city         TEXT,
        country      TEXT,
        requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_at  TIMESTAMPTZ
      )
    `);

    // Razorpay payment records
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_records (
        id         SERIAL PRIMARY KEY,
        user_id    TEXT NOT NULL,
        order_id   TEXT NOT NULL,
        payment_id TEXT NOT NULL UNIQUE,
        plan       TEXT NOT NULL,
        amount     INTEGER NOT NULL,
        status     TEXT NOT NULL DEFAULT 'captured',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Scheduled broadcasts (admin-composed, fire at a future time)
    await client.query(`
      CREATE TABLE IF NOT EXISTS scheduled_broadcasts (
        id           SERIAL PRIMARY KEY,
        emoji        TEXT NOT NULL DEFAULT '📢',
        title        TEXT NOT NULL,
        body         TEXT NOT NULL,
        fire_at      TIMESTAMPTZ NOT NULL,
        sent_at      TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      ALTER TABLE scheduled_broadcasts
        ADD COLUMN IF NOT EXISTS expo_sent_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS expo_claim_token TEXT,
        ADD COLUMN IF NOT EXISTS expo_claim_expires_at TIMESTAMPTZ
    `);

    // ── Memorial Sanctuary V1 ─────────────────────────────────────────────────

    // Enums (idempotent — one DO block per type)
    await client.query(
      `DO $$ BEGIN CREATE TYPE memorial_status AS ENUM ('draft','published','archived','removed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await client.query(
      `DO $$ BEGIN CREATE TYPE memorial_privacy_level AS ENUM ('private','family','community','public'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await client.query(
      `DO $$ BEGIN CREATE TYPE memorial_interaction_permission AS ENUM ('nobody','family','community','public'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await client.query(
      `DO $$ BEGIN CREATE TYPE memorial_candle_type AS ENUM ('yahrzeit','shabbat','memorial','neshama','shloshim'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await client.query(
      `DO $$ BEGIN CREATE TYPE memorial_tribute_status AS ENUM ('pending','approved','rejected','removed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await client.query(
      `DO $$ BEGIN CREATE TYPE memorial_family_member_role AS ENUM ('admin','member','viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await client.query(
      `DO $$ BEGIN CREATE TYPE memorial_location_type AS ENUM ('burial','birthplace','hometown','synagogue','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorial_families (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                TEXT NOT NULL,
        primary_contact_id  TEXT NOT NULL,
        member_count        INTEGER NOT NULL DEFAULT 0,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at          TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorial_family_members (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id   UUID NOT NULL REFERENCES memorial_families(id) ON DELETE CASCADE,
        user_id     TEXT NOT NULL,
        role        memorial_family_member_role NOT NULL DEFAULT 'member',
        invited_by  TEXT,
        joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (family_id, user_id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fam_members_user ON memorial_family_members (user_id);
      CREATE INDEX IF NOT EXISTS idx_fam_members_family ON memorial_family_members (family_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorial_persons (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name            TEXT NOT NULL,
        hebrew_name          TEXT,
        hebrew_father_name   TEXT,
        hebrew_mother_name   TEXT,
        birth_date           TEXT,
        birth_date_hebrew    TEXT,
        death_date           TEXT NOT NULL,
        death_date_hebrew    TEXT,
        birth_city           TEXT,
        birth_country        TEXT,
        death_city           TEXT,
        death_country        TEXT,
        tribe_affiliation    TEXT,
        occupation           TEXT,
        biography            TEXT,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at           TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorials (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug             TEXT NOT NULL UNIQUE,
        person_id        UUID NOT NULL REFERENCES memorial_persons(id) ON DELETE RESTRICT,
        family_id        UUID NOT NULL REFERENCES memorial_families(id) ON DELETE RESTRICT,
        status           memorial_status NOT NULL DEFAULT 'draft',
        created_by       TEXT NOT NULL,
        published_at     TIMESTAMPTZ,
        last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        candle_count     INTEGER NOT NULL DEFAULT 0,
        flower_count     INTEGER NOT NULL DEFAULT 0,
        tribute_count    INTEGER NOT NULL DEFAULT 0,
        prayer_count     INTEGER NOT NULL DEFAULT 0,
        view_count       INTEGER NOT NULL DEFAULT 0,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at       TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_memorials_family ON memorials (family_id) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_memorials_status ON memorials (status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_memorials_slug ON memorials (slug) WHERE deleted_at IS NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorial_privacy (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        memorial_id           UUID NOT NULL UNIQUE REFERENCES memorials(id) ON DELETE CASCADE,
        visibility_level      memorial_privacy_level NOT NULL DEFAULT 'family',
        can_light_candles     memorial_interaction_permission NOT NULL DEFAULT 'community',
        can_leave_tributes    memorial_interaction_permission NOT NULL DEFAULT 'family',
        can_view_photos       memorial_interaction_permission NOT NULL DEFAULT 'family',
        require_moderation    BOOLEAN NOT NULL DEFAULT true,
        allow_guest_interaction BOOLEAN NOT NULL DEFAULT false,
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorial_candles (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        memorial_id  UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
        user_id      TEXT,
        guest_name   TEXT,
        message      TEXT,
        candle_type  memorial_candle_type NOT NULL DEFAULT 'memorial',
        is_anonymous BOOLEAN NOT NULL DEFAULT false,
        ip_hash      TEXT,
        lit_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at   TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_candles_memorial ON memorial_candles (memorial_id) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_candles_user ON memorial_candles (user_id) WHERE user_id IS NOT NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorial_tributes (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        memorial_id      UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
        user_id          TEXT,
        guest_name       TEXT,
        guest_email      TEXT,
        title            TEXT,
        body             TEXT NOT NULL,
        language         TEXT NOT NULL DEFAULT 'en',
        is_anonymous     BOOLEAN NOT NULL DEFAULT false,
        status           memorial_tribute_status NOT NULL DEFAULT 'pending',
        moderated_by     TEXT,
        moderated_at     TIMESTAMPTZ,
        rejection_reason TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at       TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tributes_memorial ON memorial_tributes (memorial_id, status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_tributes_pending ON memorial_tributes (status, created_at) WHERE status = 'pending' AND deleted_at IS NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorial_photos (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        memorial_id    UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
        uploaded_by    TEXT NOT NULL,
        photo_url      TEXT NOT NULL,
        caption        TEXT,
        taken_year     INTEGER,
        taken_location TEXT,
        is_featured    BOOLEAN NOT NULL DEFAULT false,
        is_approved    BOOLEAN NOT NULL DEFAULT false,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at     TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_photos_memorial ON memorial_photos (memorial_id) WHERE deleted_at IS NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorial_locations (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        person_id     UUID NOT NULL REFERENCES memorial_persons(id) ON DELETE CASCADE,
        location_type memorial_location_type NOT NULL DEFAULT 'burial',
        label         TEXT NOT NULL,
        address       TEXT,
        city          TEXT,
        country       TEXT,
        latitude      TEXT,
        longitude     TEXT,
        notes         TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at    TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_person ON memorial_locations (person_id) WHERE deleted_at IS NULL;
    `);

    // ── Memorial Sanctuary V2 — SPR-017 enhancements ─────────────────────────

    // New enum for tribute types
    await client.query(
      `DO $$ BEGIN CREATE TYPE memorial_tribute_type AS ENUM ('memory','prayer','scripture','family','community'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );

    // Add relationship and community fields to candles
    await client.query(
      `ALTER TABLE memorial_candles ADD COLUMN IF NOT EXISTS relationship TEXT`,
    );
    await client.query(
      `ALTER TABLE memorial_candles ADD COLUMN IF NOT EXISTS community TEXT`,
    );

    // Add tribute_type to tributes
    await client.query(
      `ALTER TABLE memorial_tributes ADD COLUMN IF NOT EXISTS tribute_type memorial_tribute_type`,
    );

    // Performance indexes
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_memorials_view_count ON memorials (view_count DESC) WHERE deleted_at IS NULL AND status = 'published'`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_memorials_last_activity ON memorials (last_activity_at DESC) WHERE deleted_at IS NULL AND status = 'published'`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_memorials_candle_count ON memorials (candle_count DESC) WHERE deleted_at IS NULL AND status = 'published'`,
    );

    logger.info("Memorial Sanctuary V2 schema ready");

    // Beta feedback submissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id          SERIAL PRIMARY KEY,
        user_id     TEXT,
        category    TEXT NOT NULL DEFAULT 'bug',
        priority    TEXT NOT NULL DEFAULT 'medium',
        message     TEXT NOT NULL,
        page        TEXT NOT NULL DEFAULT '',
        device      TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'new',
        admin_note  TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback (status, created_at DESC)
    `);
    // PEP-705: Expand feedback table with full support-center fields
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS reference_number TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'general'`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS expected_behaviour TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS actual_behaviour TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS steps_to_reproduce TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS browser TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS device_model TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS app_version TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS problem_solved TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS who_benefits TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS importance TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS emoji_reaction TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS rating INTEGER`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS would_recommend TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS attachment_url TEXT`);
    // Backfill reference_number for rows that predate PEP-705
    await client.query(`
      UPDATE feedback SET reference_number = 'FB-' || LPAD(id::TEXT, 6, '0')
      WHERE reference_number = ''
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback (user_id) WHERE user_id IS NOT NULL
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS feedback_type_idx ON feedback (type, created_at DESC)
    `);

    // ── Community Prayer Board ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS prayer_requests (
        id            TEXT PRIMARY KEY,
        user_id       TEXT,
        name          TEXT NOT NULL DEFAULT 'Anonymous',
        is_anonymous  BOOLEAN NOT NULL DEFAULT FALSE,
        text          TEXT NOT NULL,
        category      TEXT NOT NULL DEFAULT 'Blessing',
        status        TEXT NOT NULL DEFAULT 'pending',
        pinned        BOOLEAN NOT NULL DEFAULT FALSE,
        admin_response TEXT NOT NULL DEFAULT '',
        amens         INTEGER NOT NULL DEFAULT 0,
        submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests (status, submitted_at DESC)
    `);

    // ── Member Directory (server-backed, shared across web + mobile) ────────
    await client.query(`
      DO $mds$ BEGIN
        CREATE TYPE member_directory_status AS ENUM ('pending','approved','hidden');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $mds$
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS member_directory (
        id                 TEXT PRIMARY KEY,
        user_id            TEXT NOT NULL UNIQUE,
        name               TEXT NOT NULL,
        city               TEXT NOT NULL DEFAULT '',
        country            TEXT NOT NULL DEFAULT 'India',
        role               TEXT NOT NULL DEFAULT 'Member',
        bio                TEXT NOT NULL DEFAULT '',
        whatsapp           TEXT,
        phone              TEXT,
        email              TEXT,
        other_contact      TEXT,
        birthday           TEXT,
        aliyah_date        TEXT,
        avatar_emoji       TEXT,
        profile_photo_url  TEXT,
        status             member_directory_status NOT NULL DEFAULT 'pending',
        joined_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_member_directory_status ON member_directory (status)
    `);

    // Personal Remembrance Events (yahrzeits, birthdays, anniversaries)
    await client.query(`
      CREATE TABLE IF NOT EXISTS remembrance_events (
        id                   TEXT NOT NULL,
        user_id              TEXT NOT NULL,
        name                 TEXT NOT NULL,
        relationship         TEXT NOT NULL DEFAULT '',
        event_type           TEXT NOT NULL DEFAULT 'yahrzeit',
        gregorian_date       TEXT,
        hebrew_day           INTEGER,
        hebrew_month         INTEGER,
        hebrew_year          INTEGER,
        uses_hebrew_date     BOOLEAN NOT NULL DEFAULT false,
        before_sunset        BOOLEAN NOT NULL DEFAULT true,
        notification_enabled BOOLEAN NOT NULL DEFAULT false,
        notification_days    INTEGER NOT NULL DEFAULT 1,
        repeat_annually      BOOLEAN NOT NULL DEFAULT true,
        notes                TEXT NOT NULL DEFAULT '',
        photo_url            TEXT,
        census_person_id     TEXT,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, id)
      )
    `);
    await client.query(
      `ALTER TABLE remembrance_events ADD COLUMN IF NOT EXISTS notification_time TEXT NOT NULL DEFAULT '09:00'`,
    );
    await client.query(
      `ALTER TABLE remembrance_events ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT ''`,
    );
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_remembrance_user ON remembrance_events (user_id)
    `);

    // ── Family Timeline ────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS family_timeline (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id          TEXT NOT NULL,
        event_type       TEXT NOT NULL DEFAULT 'milestone',
        title            TEXT NOT NULL,
        description      TEXT NOT NULL DEFAULT '',
        member_name      TEXT NOT NULL DEFAULT '',
        member_photo_url TEXT,
        gregorian_date   DATE,
        hebrew_date      TEXT NOT NULL DEFAULT '',
        icon             TEXT NOT NULL DEFAULT '',
        details_url      TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_family_timeline_user ON family_timeline (user_id, created_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_family_timeline_event_type ON family_timeline (user_id, event_type)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_family_timeline_greg_date ON family_timeline (user_id, gregorian_date DESC)
    `);

    // Provider-neutral identity mapping.
    // Existing account IDs remain stable when a verified Supabase email
    // matches exactly one previously linked identity.
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_identities (
        provider          TEXT NOT NULL,
        provider_subject  TEXT NOT NULL,
        account_id        TEXT NOT NULL,
        email             TEXT,
        email_verified    BOOLEAN NOT NULL DEFAULT false,
        link_status       TEXT NOT NULL DEFAULT 'unmatched',
        linked_at         TIMESTAMPTZ,
        linked_by         TEXT,
        display_name      TEXT NOT NULL DEFAULT '',
        image_url         TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (provider, provider_subject)
      )
    `);
    await client.query(`
      ALTER TABLE auth_identities
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS link_status TEXT NOT NULL DEFAULT 'unmatched',
        ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS linked_by TEXT
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_identities_account
        ON auth_identities (account_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_identities_link_status
        ON auth_identities (link_status)
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_identity_links (
        id                TEXT PRIMARY KEY,
        provider          TEXT NOT NULL,
        provider_subject  TEXT NOT NULL,
        from_account_id   TEXT NOT NULL,
        to_account_id     TEXT NOT NULL,
        actor_account_id  TEXT NOT NULL,
        reason            TEXT NOT NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_identity_links_subject
        ON auth_identity_links (provider, provider_subject, created_at DESC)
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_admin_assignments (
        account_id   TEXT PRIMARY KEY,
        assigned_by  TEXT NOT NULL,
        assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Preserve the configured legacy administrator as an application-owned
    // assignment. This does not grant access to a Replit subject by itself;
    // access is granted only after that subject resolves to this account ID.
    await client.query(
      `
      INSERT INTO app_admin_assignments (account_id, assigned_by)
      SELECT $1, 'system:configured-admin'
       WHERE $1 <> ''
      ON CONFLICT (account_id) DO NOTHING
    `,
      [process.env.ADMIN_USER_ID ?? ""],
    );
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id                TEXT PRIMARY KEY,
        account_id        TEXT NOT NULL,
        provider          TEXT NOT NULL,
        provider_subject  TEXT NOT NULL,
        email             TEXT,
        display_name      TEXT NOT NULL DEFAULT '',
        image_url         TEXT,
        is_admin          BOOLEAN NOT NULL DEFAULT false,
        expires_at        TIMESTAMPTZ NOT NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry
        ON auth_sessions (expires_at)
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_login_flows (
        id             TEXT PRIMARY KEY,
        state          TEXT NOT NULL UNIQUE,
        code_verifier  TEXT NOT NULL,
        return_to      TEXT NOT NULL DEFAULT '/',
        expires_at     TIMESTAMPTZ NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_login_flows_expiry
        ON auth_login_flows (expires_at)
    `);

    logger.info("Schema ready");

    const { rows } = await client.query("SELECT COUNT(*) AS cnt FROM books");
    const count = parseInt(rows[0].cnt, 10);

    if (count === 0) {
      logger.info("Seeding default books…");
      for (const book of SEED_BOOKS) {
        await client.query(
          `INSERT INTO books
             (title, language, category, description, cover_emoji, cover_color, file_url, is_premium, published, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            book.title,
            book.language,
            book.category,
            book.description,
            book.cover_emoji,
            book.cover_color,
            book.file_url,
            book.is_premium,
            book.published,
            book.sort_order,
          ],
        );
      }
      logger.info({ count: SEED_BOOKS.length }, "Default books seeded");
    } else {
      logger.info({ count }, "Books table already has data — skipping seed");
    }
  } finally {
    client.release();
  }
}
