## Context

The mobile app (Expo / React Native) currently attempts to register for push notifications at startup via `expo-notifications`. In development builds (Expo dev-client), calling `Notifications.getExpoPushTokenAsync()` triggers native FCM code on Android which expects a configured FirebaseApp (via `google-services.json`). When that file is not present or Firebase is not initialized, the native code throws: "Default FirebaseApp is not initialized... Make sure to call FirebaseApp.initializeApp(Context) first." This causes an unhandled rejection that crashes the JavaScript runtime.

Separately, the `AuthStore` persists a full auth blob to `expo-secure-store` under key `uniconnect-auth`. This JSON currently contains large JWTs and the full user object. The SDK warns that values larger than 2048 bytes may not be stored reliably in future SDK versions and may cause runtime exceptions.

Constraints:
- Do not add firebase credentials (google-services.json) to the repository.
- Minimal, safe changes only: prefer defensive runtime handling and a small storage shape change.
- Preserve Zero-Any Policy in code changes.

## Goals / Non-Goals

Goals:
- Prevent app crash on Android dev builds when FCM is not configured by making push registration fail-safe.
- Ensure stored auth payloads are below the 2048 byte threshold by persisting a compact payload.
- Implement safe migration/recovery: if legacy large payload exists, detect and recover without data loss (clear and force re-login with clear user message).

Non-Goals:
- Enabling full FCM integration or adding `google-services.json` to the repo.
- Building a distributed migration tool for remote users; this change targets local persistence and dev stability.

## Decisions

1. Defensive Push Registration (safe-push-registration)
   - Where: `src/features/notifications/hooks/useNotifications.ts`
   - What: Wrap the permission + token acquisition + registration flow in a try/catch. If any step throws, catch and log a warning (with link to docs) but do not rethrow.
   - When to skip entirely: Add support for a feature flag read from `Constants.expoConfig?.extra?.enablePush` (default: true). For local dev, set extra flag to false via .env or app.json if needed. The flag is optional — primary protection is try/catch.
   - Rationale: Small, focused changes avoid native rebuilds and keep runtime stable. Logging makes the failure explicit and actionable.

2. Compact Auth Persistence (compact-auth-persistence)
   - Where: `src/features/auth/store/AuthStore.ts`
   - What: Persist a reduced object with the minimal fields necessary to restore a session:
     {
       accessToken, // short token required for API calls
       refreshToken (if present),
       user: { id_user, full_name, email, picture, id_role },
       authExpiresAt (number) // epoch ms if available
     }
   - Initialize: `initializeFromStorage()` will detect legacy payloads (by size > 2048 or missing keys) and will clear them and force re-login. If clearing is required, show a non-technical message in the app: "Please sign in again to continue." Log diagnostic info.
   - Rationale: Keeping a small payload (<2KB) reduces risk of storage failures and ensures future SDK compatibility. Full user details are retrievable from API on app start.

3. Backwards Compatibility & Migration
   - When a legacy blob exists and cannot be parsed or is >2048 bytes, the store will attempt a safe recovery:
     - Try parsing; if parse succeeds but size too large, create a compact snapshot from available fields and persist compact version.
     - If parsing fails, clear and signal the UI to force login.
   - Rationale: Avoid silent data loss; prefer explicit, logged recoveries.

## Risks / Trade-offs

- [Risk] Silent suppression of push registration errors could mask genuine configuration issues.
  → Mitigation: Log a clear warning with link to FCM docs and include environment/context info. Optionally surface a developer-only banner when `__DEV__` is true.

- [Risk] Clearing legacy auth storage could log users out unexpectedly.
  → Mitigation: Attempt best-effort migration first (extract tokens & minimal user); only clear if migration fails. When clearing, show a user-facing message explaining they must sign in again.

- [Trade-off] Deferring full FCM integration avoids adding credentials to repo but requires building dev clients to test full push flows. This keeps repo clean and reduces secret leakage risk.

## Migration Plan

1. Feature branch with changes to hooks and AuthStore.
2. QA: Run development build on Android without google-services.json — app should start without crash; logs should show a graceful push registration failure message.
3. QA: Simulate large SecureStore value by seeding `uniconnect-auth` with large JSON, then start app; verify compact migration or safe clearing occurs and user is prompted to login.
4. Merge to main. No server-side changes required.

## Open Questions

- Should we add an internal diagnostic flag or telemetry event when push registration fails so SRE/devs can triage frequency across environments?
- Do we want to add an app-level developer banner when push is disabled in dev to make the state explicit?

Created-by: openspec automation
