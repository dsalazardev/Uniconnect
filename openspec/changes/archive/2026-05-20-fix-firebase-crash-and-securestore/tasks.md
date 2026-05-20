## 1. Safe push registration (frontend mobile)

 - [x] 1.1 Add feature flag support: read `Constants.expoConfig?.extra?.enablePush` with safe default `true`.
 - [x] 1.2 Edit `src/features/notifications/hooks/useNotifications.ts`:
  - Wrap permission request + token retrieval + backend registration in a single `try/catch`.
  - If `enablePush === false`, skip registration early.
  - On error, log a clear developer-only warning that includes `https://docs.expo.dev/push-notifications/fcm-credentials/` and the device/platform context, but do not throw.
  - Ensure no partial token is sent to the backend on failure.
- [ ] 1.3 Add unit tests/mocks for the hook behavior (simulate expo-notifications throwing; verify it does not propagate error). If unit testing hooks is not present in repo, add an integration smoke test verifying the component mounting does not throw.

## 2. Compact auth persistence (frontend mobile)

 - [x] 2.1 Modify `persistToStorage()` in `src/features/auth/store/AuthStore.ts` to serialize only the compact snapshot: `{ accessToken, refreshToken?, user: { id_user, full_name?, email?, picture?, id_role? }, expires_at? }`.
 - [x] 2.2 Modify `initializeFromStorage()` to detect legacy large blobs:
  - If `storedAuth.length > 2048`, attempt to `JSON.parse()`; if parse succeeds, extract a compact snapshot and overwrite stored value. If parse fails, clear stored item and set store to unauthenticated.
  - Add logging for migration actions (trimmed, cleared) with diagnostic info (length, parse success) but avoid printing tokens.
- [ ] 2.3 Add unit tests for persistence/migration logic (simulate small/large/invalid stored strings).

## 3. QA and verification

- [ ] 3.1 Manual test: Start Android dev-client without `google-services.json`. App should start and show no crash; logs contain the friendly push warning.
- [ ] 3.2 Manual test: Seed `uniconnect-auth` in SecureStore with large JSON (simulate long JWT); start app and verify that the store performs migration or clears value and app remains functional.
- [ ] 3.3 Run unit tests and ensure new tests pass.

## 4. Documentation & developer guidance

- [ ] 4.1 Update AGENTS.md or README section "Troubleshooting - Push Notifications" with guidance on enabling FCM for local dev and the reason we don't commit google-services.json.
- [ ] 4.2 Add small note in onboarding / dev README: how to opt-in to push locally (add dev google-services.json + build dev client).
