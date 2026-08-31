# Replit Auth Migration Design

## Goal

Replace Clerk with Replit Auth for the MENASHE Calendar web application and
Express API while preserving existing user-owned data, including profiles,
memorial records, yahrzeit entries, Torah tracker entries, push subscriptions,
premium state, and administrator access.

The final application will use Replit Auth for browser sessions and API
authorization. Clerk will remain available only during a controlled transition
until existing users and administrator access have been verified.

## Constraints and non-goals

- Do not replace the existing PostgreSQL database.
- Do not delete or rewrite user-owned records as part of the provider change.
- Do not import Clerk passwords or claim that Replit Auth credentials can be
  migrated.
- Do not weaken authentication or make protected routes public.
- Do not change the Web Push, queue, object-storage, payment, or AI
  architectures except where their authenticated user lookup currently depends
  on Clerk.
- Do not modify Expo/mobile authentication in this migration.
- Use Replit's managed Auth setup rather than implementing an undocumented
  OAuth/OIDC flow manually.

## Recommended approach

Use a provider-neutral internal account identity and a staged provider
transition:

1. Add an internal identity mapping layer that maps one or more external
   authentication subjects to one stable application user key.
2. Keep existing Clerk-backed identities readable during the transition.
3. Add Replit Auth as the new primary browser session and API credential.
4. Link a Replit identity to an existing application account only when the
   identity is verified by a matching verified email or an explicit,
   authenticated account-link flow.
5. Move every protected API route to the provider-neutral authorization helper.
6. Replace Clerk UI and token retrieval in the web app with Replit Auth.
7. Verify existing users, new users, and administrators.
8. Remove Clerk middleware, frontend package/configuration, proxy routes, and
   transition-only code after the migration acceptance checks pass.

This avoids a destructive rewrite of owner IDs and supports a reversible
transition. A direct subject-ID replacement is not acceptable because it would
orphan rows whose `user_id` currently contains a Clerk subject.

## Identity model

Add an application-owned identity mapping with these logical fields:

- stable internal account ID
- provider (`clerk` or `replit`)
- provider subject ID
- normalized email when supplied and verified
- link status and timestamps
- audit metadata for who/when established the link

Existing tables may continue to store their current owner key during the first
phase. The authorization layer resolves the current external session to the
same stable owner key before route handlers query data. If a compact,
transactional backfill is safer after the mapping is proven, it may migrate
rows later; the first release must not require that rewrite.

Email matching must never be performed on an unverified address. If more than
one candidate exists, or the email is unavailable, the user must complete an
explicit link flow rather than being silently merged.

## Authentication data flow

### Browser

1. Replit Auth initializes the session in the web app.
2. The app renders a loading state while the session is unresolved.
3. Signed-out users see the sign-in entry point.
4. Signed-in users receive the current application shell.
5. API requests use the Replit Auth session mechanism supplied by the managed
   setup; no Clerk token getter or Clerk proxy URL remains in the final state.

The app must not render an empty screen when authentication is unavailable.
Loading, signed-out, and auth-error states must each have visible UI.

### API

1. Replit Auth middleware validates the incoming managed session.
2. A provider-neutral request context exposes:
   - external subject
   - stable application account ID
   - verified email when available
   - application role
3. `requireAuth` rejects missing or invalid sessions with HTTP 401.
4. `requireAdmin`, `requireModerator`, and branch authorization resolve roles
   from the application database and configured administrator policy, not from
   Clerk organization claims.
5. Route handlers continue to use the resolved stable owner key, preventing
   provider-specific subject IDs from leaking into business logic.

## Roles and administrator access

Clerk's `org:admin` claim is not portable to Replit Auth. Before removing Clerk,
the migration must establish an application-owned admin source of truth.

- Preserve the existing configured administrator account through a verified
  Replit identity link.
- Store application admin roles in the database or an explicitly managed
  server-side allowlist.
- Keep branch-specific roles (`local_admin`, `regional_admin`,
  `national_admin`) database-backed.
- Ensure every admin route checks the provider-neutral role resolver.
- Audit denied requests and role changes using the existing audit-log system.

No Replit account becomes an administrator merely because it signed in.

## Existing data migration

The migration must provide:

- a read-only inventory of distinct existing owner IDs and their data counts;
- a safe way to associate existing Clerk accounts with Replit accounts;
- an audit record for each link;
- a report of unmatched or ambiguous accounts;
- no destructive delete or automatic merge.

For users who cannot be matched by verified email, retain their existing data
and provide a clear account-link path while the transition remains active.
Those users must not receive another user's records, even if names or profile
fields match.

## Error handling and security

- Invalid, expired, or missing Replit sessions return 401.
- Authenticated users without the required application role receive 403.
- Ambiguous identity matches fail closed and require explicit linking.
- Auth-provider outages show a visible retry/error state instead of a blank
  application shell.
- Never log session cookies, bearer tokens, provider secrets, or full identity
  payloads.
- Continue using the existing rate limiting, Helmet, CORS validation, and audit
  logging.
- Keep Clerk secrets and proxy code until the transition is complete; remove
  them only after no production path depends on them.

## Verification plan

### Migration acceptance API

During the transition, administrators use the API server's application-owned
auth controls:

- `GET /api/admin/auth/inventory` returns the current Replit identity
  inventory, verified-email Clerk matches, unmatched and ambiguous identities,
  per-account counts for profiles, memorials, family memberships,
  notifications, and premium records, plus administrator assignments.
- `POST /api/admin/auth/identity-links` accepts a Replit provider subject,
  stable account ID, and required human reason. It records an immutable link
  event, marks the identity explicitly linked, invalidates its sessions, and
  never rewrites user-owned rows.
- `GET /api/admin/auth/admin-assignments`,
  `POST /api/admin/auth/admin-assignments`, and
  `DELETE /api/admin/auth/admin-assignments/:accountId` manage the
  application-owned administrator source of truth. The configured legacy
  administrator is seeded into this table idempotently.

The inventory fails closed for ambiguity: a verified Replit email matching
multiple Clerk users is kept on its isolated `replit:<subject>` account until
an administrator explicitly links it. A missing or unverified email is also
reported as unmatched rather than being guessed from a name.

### Automated

- Unit-test provider-neutral session normalization.
- Test missing, invalid, valid, and expired Replit sessions.
- Test stable-owner resolution and ambiguous email matching.
- Test admin, moderator, branch-role, and non-admin authorization.
- Test that all previously protected route groups still reject anonymous
  requests.
- Test that mapped Replit identities can read and mutate only their own
  existing data.
- Run API typecheck, web typecheck/build, existing security tests, and
  notification/queue tests.

### Manual acceptance

1. Sign in with a new Replit account and verify a new profile is provisioned.
2. Link an existing Clerk account through the approved link path.
3. Confirm profile, memorial, yahrzeit, Torah tracker, push, premium, and
   community data remain available.
4. Confirm a second account cannot access the first account's data.
5. Confirm the configured administrator can access all admin surfaces.
6. Confirm a normal member receives 403 on admin-only routes.
7. Sign out, refresh, and verify the signed-out experience is visible.
8. Simulate an auth failure and verify a visible recovery state rather than a
   blank screen.
9. Re-test the published web app before deleting Clerk transition support.

## Rollout and rollback

Roll out in phases:

1. Provision Replit Auth through the managed Auth flow.
2. Deploy the provider-neutral API and identity mapping in compatibility mode.
3. Enable Replit sign-in and linking for a test account.
4. Validate existing data and admin access.
5. Make Replit Auth the default and monitor auth/audit errors.
6. Remove Clerk only after the acceptance checklist passes.

Rollback before final removal means restoring Clerk as the active provider while
leaving the identity mapping and existing data untouched. Do not roll back by
deleting mappings or user-owned rows.

## Open implementation prerequisite

Replit's official documentation states that Replit Auth setup and its database
entries are managed by Agent. Implementation should begin only after the
managed Replit Auth setup is available to this workspace; the code must use
the generated setup rather than inventing a replacement provider contract.