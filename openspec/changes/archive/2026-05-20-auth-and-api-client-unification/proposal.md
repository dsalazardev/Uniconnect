## Why

The frontend has two critical architectural problems: (1) a race condition in Mobile where API calls fire before authentication is ready, causing spurious "Network Error" logs on every launch even though login succeeds, and (2) the Web frontend was scaffolded as a copy of Mobile with Expo-specific imports (`expo-auth-session`, `expo-web-browser`) and 9 separate Axios instances per feature — each with token refresh stubbed as `throw new Error()`. This makes the web app non-functional for auth and creates maintenance drag from duplicated, broken code.

## What Changes

- **Mobile — Race Condition Fix**: Components that fire protected API calls (notifications, events, groups, etc.) must wait for `AuthStore.isInitialized === true` AND a valid token before sending requests. The Axios request interceptor will queue requests if auth is not ready.
- **Web — Auth Integration**: Remove dead Expo-specific copies (`useAuth0Login.ts` is a literal copy of mobile's, with `expo-auth-session` imports), stub `authController` references, and implement a proper web auth flow using the shared `AuthService` from `@uniconnect/shared` with a web-compatible redirect (Auth0 Universal Login via popup/redirect).
- **Web — Single API Client**: Replace 9 per-feature `createApiClient()` calls with a single shared Axios instance in `constants/api.ts`, matching the Mobile pattern. Token refresh mutex and queueing (FIX-10) will be shared logic from `@uniconnect/shared`.
- **Shared Package — AuthProvider Enhancement**: Ensure `createApiClient()` in shared supports a `ready`/`initialized` guard so interceptors can defer requests until auth is hydrated.

## Capabilities

### New Capabilities
- `auth-race-condition`: Guard mechanism that prevents protected API calls from firing before auth state is hydrated, across both platforms
- `web-auth-flow`: Auth0 Universal Login flow for the web frontend using standard OAuth redirect (not Expo-specific libraries)
- `api-client-unification`: Single shared Axios instance configuration consumed by all services in each frontend

### Modified Capabilities
- _(none — no existing capabilities have requirement changes)_

## Impact

- `Frontend/Frontend-mobile/src/constants/api.ts` — Add auth-ready guard to interceptor
- `Frontend/Frontend-mobile/src/features/auth/store/AuthStore.ts` — Add `isReady` computed
- `Frontend/Frontend-mobile/src/features/auth/hooks/useAuth0Login.ts` — Remove duplicate (only web version needs removal)
- `Frontend/Frontend-web/src/constants/api.ts` — Rewrite to single shared instance
- `Frontend/Frontend-web/src/features/auth/` — Remove dead Expo hooks, add real web auth
- `Frontend/Frontend-web/src/features/*/services/index.ts` — Remove per-feature `createApiClient()`, use shared api
- `Frontend/shared/src/api/client.ts` — Add `isReady` callback support
