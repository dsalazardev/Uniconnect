## Context

The project has two independent frontends (Mobile React Native/Expo, Web React/Vite) sharing a `@uniconnect/shared` package. Currently:

- **Mobile**: Has a single shared Axios instance in `constants/api.ts` with full token refresh mutex + queue (FIX-10), but no guard preventing requests from firing before `AuthStore` is hydrated from SecureStore. This causes a "Network Error" on every cold start when components (e.g., notifications badge) mount before auth is ready.
- **Web**: Has 9 separate `createApiClient()` calls — one per feature in each `services/index.ts` — each creating a new Axios instance with its own `authProvider`. Token refresh is stubbed as `throw new Error('not implemented')`. The `useAuth0Login` hook is a literal copy of mobile's `expo-auth-session` code. The `controllers/` folder doesn't exist, but `useAppInitialization` and `useTokenRefresh` import from it — meaning the web app cannot currently build or run with auth.
- **Shared**: `createApiClient()` supports `authProvider` with `getAccessToken`, `isTokenExpired`, `hasRefreshToken`, `isRefreshing`, `refreshTokens`, `clearAuth` — but has no `isReady` guard.

## Goals / Non-Goals

**Goals:**
- Eliminate the "Network Error" race condition in Mobile by preventing API calls before auth is hydrated
- Make Web auth functional using Auth0 Universal Login via standard browser redirect (no Expo dependencies)
- Unify API client creation to a single shared Axios instance per frontend, both consuming the same interceptor logic from `@uniconnect/shared`
- Keep token refresh logic (FIX-10 mutex + queue) in shared, consumed by both platforms
- Remove dead/mock code from web (Expo hooks, per-feature API instances, stub controller imports)

**Non-Goals:**
- Not rewriting the entire auth system — Auth0 + JWT + BFF pattern stays
- Not changing the Mobile auth UX flow (PKCE + redirect already works)
- Not migrating from MobX or changing store patterns
- Not implementing social login beyond Auth0

## Decisions

### D1: Auth-ready guard via `AuthProvider.isReady` callback (not a new queue)

Two options for preventing pre-auth requests:

- **Option A (Pre-queue in interceptor)**: Each frontend's Axios interceptor checks `authStore.isInitialized && authStore.accessToken` before sending. If not ready, return a promise that resolves when auth emits an event.
- **Option B (Shared-level `isReady`)**: Add `isReady: () => boolean` to the `AuthProvider` interface in shared. The `createApiClient()` request interceptor checks it and either sends or blocks.

**Decision**: Option B. Adding `isReady` to the shared `AuthProvider` means both frontends implement it once, and the logic lives in `shared/src/api/client.ts` — not duplicated. Mobile's interceptor already exists in `constants/api.ts`, but Option B lets the shared factory handle it natively. However, since Mobile already has a custom interceptor (not using `createApiClient()`), Option B only applies to the shared factory. For Mobile, we'll add a guard in the existing request interceptor in `constants/api.ts`.

**Resolution**: Two-pronged:
1. `shared/src/api/client.ts` — Add `isReady` to `AuthProvider`, add check in request interceptor
2. `mobile/src/constants/api.ts` — Add `isReady` check mirroring `authStore.isInitialized && !!authStore.accessToken`

### D2: Web auth uses standard OAuth redirect, not Expo-auth-session

The Web version's `useAuth0Login.ts` was copied from mobile and imports `expo-auth-session`, `expo-web-browser`, `expo-constants` — none available in Vite/web.

**Decision**: Replace with `@auth0/auth0-spa-js` (Auth0 SPA SDK) which handles:
- PKCE automatically
- Redirect to Auth0 Universal Login
- Token storage in memory/localStorage
- Silent token refresh via iframe

This is the standard approach for React SPAs. The SDK manages the auth session, and we bridge it to MobX via the existing `AuthStore` interface.

### D3: Single Axios instance in Web via `constants/api.ts`

**Decision**: Mirror the Mobile pattern exactly:
1. Create `constants/api.ts` in Web with a single `api` export
2. Use `createApiClient()` from shared with `AuthProvider` connected to `AuthStore`
3. All feature `services/index.ts` import from this shared `api`
4. Remove per-feature `createApiClient()` calls

### D4: Dead code removal strategy

- Web `features/auth/hooks/useAuth0Login.ts` → Delete (replaced by `@auth0/auth0-spa-js`)
- Web `features/auth/hooks/useAppInitialization.ts` → Keep but fix import path (import from store directly, not controller)
- Web `features/auth/hooks/useTokenRefresh.ts` → Keep but fix import path
- Web `features/auth/hooks/useLogin.ts` → Already a stub, delete
- Mobile `features/auth/hooks/useLogin.ts` → Already a stub, delete

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Race condition fix changes timing of app init** — components may render empty states longer | Add `isInitializing` state to Layout/root component; show a splash until ready |
| **Web auth0-spa-js adds ~40KB to bundle** | Acceptable; it's the standard Auth0 SDK for SPAs. Code-split if needed |
| **Web token refresh via iframe may fail** due to third-party cookie blocking | Fall back to redirect-based refresh (full page redirect), `auth0-spa-js` handles this |
| **Removing per-feature api instances** could miss a feature that depends on a custom config | Audit all 9 service files before removal; none have custom config (all identical) |
| **Mobile interceptor has duplicate logic** with shared factory | Not refactoring mobile to use shared factory in this change; guard addition is minimal |
