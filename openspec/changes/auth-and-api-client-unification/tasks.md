## 1. Shared Package — Add isReady to AuthProvider

- [ ] 1.1 Add `isReady: () => boolean` to `AuthProvider` interface in `shared/src/api/client.ts`
- [ ] 1.2 Add auth-ready guard in `createApiClient()` request interceptor: if `!authProvider.isReady()`, defer/reject the request
- [ ] 1.3 Update `createApiClient()` options type to include `isReady` in the validation if needed
- [ ] 1.4 Run `npm run typecheck:shared` to verify zero TypeScript errors

## 2. Mobile — Fix Auth Race Condition

- [ ] 2.1 Add `get isReady()` computed to `AuthStore` (returns `this.isInitialized && !!this.accessToken`)
- [ ] 2.2 Add auth-ready guard in `mobile/src/constants/api.ts` request interceptor: check `authStore.isReady` before sending; if not ready, reject with a descriptive error
- [ ] 2.3 Ensure `useInitNotifications` and similar early-mount hooks handle the rejected promise gracefully (silent retry or wait pattern)
- [ ] 2.4 Verify cold-start: launch app with stored session, confirm no "Network Error" in console logs

## 3. Web — Single Shared API Client

- [ ] 3.1 Rewrite `web/src/constants/api.ts` with a single `api` export using `createApiClient()` from shared, connected to `AuthStore` via `AuthProvider`
- [ ] 3.2 Ensure `isReady` callback returns `authStore.isInitialized && !!authStore.accessToken`
- [ ] 3.3 Update all 9 feature `services/index.ts` files to import `api` from `@/constants/api` instead of calling `createApiClient()`:
  - [ ] 3.3.1 `features/events/services/index.ts`
  - [ ] 3.3.2 `features/groups/services/index.ts`
  - [ ] 3.3.3 `features/messages/services/index.ts`
  - [ ] 3.3.4 `features/auth/services/index.ts`
  - [ ] 3.3.5 `features/notifications/services/index.ts`
  - [ ] 3.3.6 `features/students/services/index.ts`
  - [ ] 3.3.7 `features/connections/services/index.ts`
  - [ ] 3.3.8 `features/courses/services/index.ts`
  - [ ] 3.3.9 `features/programs/services/index.ts`
- [ ] 3.4 Remove any leftover `createApiClient` imports from feature service files
- [ ] 3.5 Run `npx tsc --noEmit` in web to verify zero TypeScript errors

## 4. Web — Auth0 Integration with @auth0/auth0-spa-js

- [ ] 4.1 Install `@auth0/auth0-spa-js` in `Frontend-web/`
- [ ] 4.2 Create `web/src/features/auth/lib/auth0-client.ts` — initialize `Auth0Client` with same tenant, client ID, audience, and scope as mobile
- [ ] 4.3 Implement `webAuthService` or integrate `handleRedirectCallback()` in `LoginScreen` to process Auth0 redirect on mount
- [ ] 4.4 Create a web-compatible `AuthController` (or inline the logic) that:
  - Reads tokens from Auth0 SDK on callback
  - Calls backend `/auth/callback` with the authorization code (same as mobile)
  - Stores result in `AuthStore.setAuth()`
  - Redirects to events or onboarding
- [ ] 4.5 Update `LoginScreen.tsx`:
  - Remove `window.alert` placeholder
  - Import and call `auth0Client.loginWithRedirect()` on button click
  - Show loading state while redirecting
  - Handle the post-redirect callback automatically on mount

## 5. Web — Remove Dead / Mock Auth Code

- [ ] 5.1 Delete `web/src/features/auth/hooks/useAuth0Login.ts`
- [ ] 5.2 Delete `web/src/features/auth/hooks/useLogin.ts`
- [ ] 5.3 Fix `web/src/features/auth/hooks/useAppInitialization.ts` — replace `authController.initializeAuth()` import with direct `AuthStore` + initialization logic
- [ ] 5.4 Fix `web/src/features/auth/hooks/useTokenRefresh.ts` — replace `authController.refreshTokens()` import with direct call to `AuthStore` + shared `AuthService`
- [ ] 5.5 Verify `controllers/` directory is no longer referenced anywhere in web auth
- [ ] 5.6 Delete `mobile/src/features/auth/hooks/useLogin.ts` (already a dead stub)

## 6. Verification

- [ ] 6.1 Run `npm run typecheck:all` — confirm zero TypeScript errors across shared, web, and mobile
- [ ] 6.2 Run `npm run test:mobile` — confirm all tests pass with no regressions
- [ ] 6.3 Run `npm run test:web` — confirm all tests pass
- [ ] 6.4 Manual check: Mobile cold-start with stored session — no "Network Error" in console
- [ ] 6.5 Manual check: Web login flow — redirects to Auth0, returns, stores token
- [ ] 6.6 Manual check: Web protected API calls include Bearer token header
