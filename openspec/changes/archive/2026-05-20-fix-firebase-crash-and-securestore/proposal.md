## Why

Two runtime issues are blocking development and pose future stability risks:

- Android development builds crash at startup when `expo-notifications` attempts to obtain an FCM token but the native Firebase app is not initialized (missing `google-services.json`). This breaks the app on devices and prevents developers from continuing work without adding native configuration.
- The app stores a large JSON blob under `uniconnect-auth` in `expo-secure-store`. The combined size of JWTs, refresh tokens and the full user object can exceed 2048 bytes; current SDKs warn this may fail or throw in future releases.

Fixing these two problems will unblock local development, harden persistence for future SDK changes, and reduce the chance of user-facing crashes during onboarding or app start.

## What Changes

- Add defensive handling around push token registration to prevent uninitialized Firebase from crashing the app in development environments. This is a non-breaking, runtime-safety change.
- Reduce the SecureStore payload size by persisting a minimized auth payload (only essential tokens and minimal user identity fields). This is an internal storage change and will be implemented in a backwards-compatible way (migration/clear path if legacy data is detected).

## Capabilities

### New Capabilities
- `safe-push-registration`: Add a robust, environment-aware push registration pathway that fails gracefully when native FCM is not available or not configured.

- `compact-auth-persistence`: Persist a minimized auth payload to SecureStore to guarantee sizes below SDK constraints and add a migration/cleanup path for legacy large blobs.

### Modified Capabilities
- None — behavior and API contracts exposed to the backend are unchanged. These are internal robustness improvements.

## Impact

- Files to modify (frontend mobile):
  - `src/features/notifications/hooks/useNotifications.ts` (wrap token registration in try/catch + optional feature flag)
  - `src/components/AppRoot.tsx` (calls the hook; no behavioral change expected)
  - `src/features/auth/store/AuthStore.ts` (change persistToStorage / initializeFromStorage to use compact payload)

- Risks & dependencies:
  - If the team later decides to enable full FCM in local dev, a dev google-services.json and a dev build will be required. This proposal purposefully avoids adding firebase config to the repo.
  - Migration: clearing or migrating legacy `uniconnect-auth` entries is required if their size prevents storage. The design will include a safe detection-and-recovery path.

Created-by: openspec automation
