#!/bin/bash
set -euo pipefail

OUTPUT="docs/REPLIT_DATA_MIGRATION_BASELINE.md"

mkdir -p docs

echo "# Replit Data Migration Baseline" > "$OUTPUT"
echo "Generated on: $(date)" >> "$OUTPUT"
echo "Sanitized report: Does not contain credentials." >> "$OUTPUT"
echo "" >> "$OUTPUT"

TABLES=(
"books"
"user_public_profiles"
"user_profiles"
"yahrzeit_entries"
"torah_tracker_entries"
"torah_tracker_goals"
"community_yahrzeit"
"community_yahrzeit_learners"
"push_subscriptions"
"census_branches"
"branch_review_events"
"branch_admin_roles"
"census_submissions"
"census_member_submissions"
"community_announcements"
"expo_push_tokens"
"premium_requests"
"payment_records"
"scheduled_broadcasts"
"memorial_families"
"memorial_family_members"
"memorial_persons"
"memorials"
"memorial_privacy"
"memorial_candles"
"memorial_tributes"
"memorial_photos"
"memorial_locations"
"feedback"
"prayer_requests"
"member_directory"
"remembrance_events"
"family_timeline"
)

for table in "${TABLES[@]}"; do
    echo "## Table: $table" >> "$OUTPUT"

    COUNT=$(psql "$DATABASE_URL" \
        -X \
        -v ON_ERROR_STOP=1 \
        -tAc "SELECT COUNT(*) FROM public.\"$table\";")

    echo "- Row Count: $COUNT" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
done

echo "Inventory Complete: $OUTPUT"
