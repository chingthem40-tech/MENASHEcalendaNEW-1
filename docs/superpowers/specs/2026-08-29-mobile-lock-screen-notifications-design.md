# MENASHE Mobile Lock-Screen Notifications

## Status

Approved design for implementation.

## Goal

Enable the existing MENASHE Expo mobile app to deliver operating-system
notifications on Android and iOS when the app is backgrounded, removed from
recent apps, closed, or the device is locked, without introducing a second
notification architecture or changing web push.

The implementation must distinguish code/configuration readiness from physical
device verification. No lock-screen behavior will be claimed as verified until
an actual production build has been tested on physical Android and iOS devices.

## Existing architecture to preserve

### Local OS-scheduled notifications

`artifacts/menashe-mobile/lib/notifications.ts` owns local scheduling through
`expo-notifications`. It requests permission, creates the existing
`menashe-default` Android channel, and schedules Shabbat, Havdalah, Parashat,
holiday, and prayer reminders with `scheduleNotificationAsync`.

`artifacts/menashe-mobile/context/AppContext.tsx` loads persisted preferences,
initializes the channel, reschedules after permission is granted, and updates
the schedule when preferences, location, or lead time change.

### Server-generated mobile push

`artifacts/menashe-mobile/lib/expoPush.ts` obtains an Expo push token after
permission and sends it to the authenticated API using a Clerk bearer token.

`artifacts/api-server/src/routes/push.ts` owns the existing authenticated
`/push/expo-token`, `/push/expo-send-test`, broadcast, and scheduled broadcast
routes. Tokens are stored in the existing `expo_push_tokens` table and are
associated with `req.userId` derived from Clerk authentication.

The server sends remote messages through `expo-server-sdk`. Web push through
VAPID and `push_subscriptions` remains separate and is not changed.

### Mobile configuration

`artifacts/menashe-mobile/app.json` already declares the
`expo-notifications` plugin, the `menashe-default` default channel, Android
`POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, and `SCHEDULE_EXACT_ALARM`
permissions. `artifacts/menashe-mobile/eas.json` already contains development,
preview, and production profiles.

## Minimal implementation

1. Keep `lib/notifications.ts` as the only local scheduler.
2. Add the existing `menashe-default` channel ID to local notification content
   and to every remote Expo message so Android uses the configured channel.
3. Preserve the existing permission flow, while ensuring the app's enable
   action creates the channel before scheduling or registering a token.
4. Keep token registration authenticated and user-derived on the server.
5. Reuse `expo_push_tokens`; do not add a second mobile token table.
6. Process Expo delivery receipts in the existing server send path and remove
   tokens that Expo reports as permanently unregistered, while preserving the
   existing explicit unregister route.
7. Add one root-level notification response listener using Expo Router. It will
   handle both cold-start and foreground/background taps and map explicit
   notification data to existing screens:
   - announcements and broadcasts → `community/announcements`
   - yahrzeit and memorial reminders → `community/memorials`
   - calendar, Shabbat, Havdalah, parasha, holiday, and prayer reminders →
     `calendar`
8. Add notification data to existing local and remote payloads so the tap
   listener does not infer routes from display text.
9. Use an explicit Expo project ID for token acquisition when the production
   configuration supplies one. Do not invent an EAS project ID; report it as a
   production configuration requirement if it is absent.
10. Do not change web push routes, VAPID behavior, web service-worker behavior,
    unrelated screens, or add JavaScript timers for mobile delivery.

## Delivery behavior

### Local notifications

The OS owns delivery after the app schedules the notification. These cover
location-aware calendar reminders and prayer timing that can be calculated on
the device. They must remain usable without network access after scheduling.

### Remote notifications

The API sends announcements, broadcasts, dedication events, test messages, and
other server-originated events through Expo push tokens. The server selects
tokens by the authenticated Clerk user or through the existing admin broadcast
path. Expo and the operating system deliver the notification after the app
process is terminated.

### Browser notifications

The existing VAPID service-worker system remains web-only. It is not reused for
the Expo app and receives no architectural changes.

## Permission and platform requirements

### Android

- Request `POST_NOTIFICATIONS` at the existing enable action.
- Create or reuse `menashe-default` with high importance.
- Set `channelId: "menashe-default"` on local and remote payloads.
- Keep standard alert, sound, vibration, and badge behavior.
- Use normal lock-screen notifications; do not use full-screen intents.
- Retain boot and exact-alarm declarations already present in `app.json`.

### iOS

- Request alert permission through `expo-notifications`.
- Preserve existing sound and badge preferences.
- Use the production Expo push configuration and APNs credentials associated
  with the app's bundle identifier.
- Do not claim terminated-app delivery until a physical production build is
  tested.

## Error handling and security

- Denied permissions must prevent registration and scheduling and must not
  create a false enabled state.
- If permission is permanently denied, the existing settings flow should direct
  the user to OS settings where appropriate.
- The server must ignore any client-supplied user ID for mobile token ownership.
- Clerk bearer authentication remains required for token registration,
  unregistration, and user test sends.
- Invalid Expo tokens reported by delivery receipts are removed from the
  existing table.
- No Clerk secret, VAPID private key, database credential, or Expo credential
  may enter a mobile or web bundle.

## Production configuration

The implementation will report, without exposing values, whether these are
available:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` for the mobile bundle.
- `EXPO_PUBLIC_DOMAIN` for authenticated API requests.
- `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` on the API.
- `DATABASE_URL` as the runtime-managed database connection.
- The Expo/EAS project ID used for `getExpoPushTokenAsync`.
- Android FCM and iOS APNs credentials for the production app.

The existing VAPID variables remain web-only. `VAPID_PRIVATE_KEY` is not used by
the mobile Expo path.

## Validation plan

### Automated checks

- Mobile TypeScript check.
- Mobile lint.
- API typecheck.
- API build.
- Web build.
- Verify the authenticated token registration route rejects missing/invalid
  authentication and stores a valid token against the authenticated user.
- Verify the existing Expo send-test path uses the stored user token and
  removes permanent delivery failures.
- Verify the generated Android notification channel and payload metadata.

### Physical-device checks

For Android and iOS production builds, use a real test account and device:

1. Open MENASHE and sign in.
2. Enable notifications and accept OS permission.
3. Confirm the relevant Android channel or iOS notification settings are
   enabled.
4. Confirm the Expo token registration request succeeds for the signed-in user.
5. Send an existing server test push.
6. Verify delivery while the app is open.
7. Background the app and verify delivery.
8. Remove the app from recent apps and verify delivery.
9. Lock the screen and leave it locked until delivery.
10. Tap the notification and verify MENASHE opens to the mapped existing
    screen.
11. Repeat with a local scheduled reminder.
12. Repeat after device restart if the platform/build configuration supports
    scheduled delivery after reboot.
13. Repeat on both Android and iOS.
14. Record permission-disabled, channel-disabled, Focus/Do Not Disturb,
    battery-restriction, and offline behavior as expected limitations rather
    than app failures.

## Out of scope

- Replacing Expo notifications.
- Adding a second scheduler.
- Replacing local schedules with server timers.
- Changing web push.
- Using full-screen intents.
- Guaranteeing delivery when the user disables OS notifications, a channel, or
  Focus/Do Not Disturb suppresses alerts.