# Findings — Frontend Audit (initial sweep)

Summary
-------
This initial audit inspected the shared Axios factory and the web-mobile parity tasks to evaluate readiness for an authentication unification. I performed two targeted reads: 

1) Frontend/shared Api client: Frontend/shared/src/api/client.ts
2) Web-mobile parity task list: openspec/changes/web-mobile-architecture-parity/tasks.md

Key observations
----------------
- Shared Axios Factory (shared/src/api/client.ts):
  - Implements an AuthProvider interface with methods: getAccessToken, isTokenExpired, hasRefreshToken, isRefreshing, refreshTokens, isReady/isInitialized, clearAuth.
  - Implements a robust refresh mutex + queue (isRefreshing, failedQueue, processQueue) and 401-retry logic that integrates with an injected authProvider.
  - Request interceptor blocks requests when authProvider.isInitialized() is false, which prevents premature requests during hydration.
  - Response interceptor performs optional FEN validation and implements the queueing and retry logic on 401s.
  - Design supports graceful degradation: on refresh failure it clears auth and rejects queued requests with a RefreshError object.

- Web/Mobile parity tasks (web-mobile-architecture-parity/tasks.md):
  - Many parity steps already completed; remaining items include: production build failures (blocked tasks 8.2, 8.4) and manual smoke tests.
  - Auth-specific specs exist (auth-parity/spec.md) requiring: correct refreshTokens behaviour, PKCE code_verifier handling, and server logout before clearAuth.
  - The parity task set documents explicit extraction of shared services (FilesService, NotificationObserverService) and confirms `@uniconnect/shared` already exports createApiClient/AuthProvider patterns.

Areas of technical debt and immediate risks
---------------------------------------
- Build failures (web production build blocked) — several UI screens and hooks produce errors preventing a clean production build. These must be triaged but are out-of-scope for this audit-phase.
- Runtime crash candidates:
  - SecureStore/Firebase: the repo contains platform-specific storage and push token integrations; inconsistent initialization can cause runtime crashes if auth hydration ordering is incorrect.
  - Jest ESM mismatch: multiple versions of jest-config and pretty-format observed across lockfiles; this may surface as runtime failures or test runner crashes when running with Hermes/React Native.
- Duplicate refresh logic: Some workspaces have ad-hoc refresh logic; migrating to the shared AuthProvider will reduce duplicate code but requires careful rollout to avoid creating partial states where some modules still refresh tokens independently.

Immediate recommendations
-------------------------
1. Create a canonical AuthProvider adapter in each platform that implements the shared interface and delegates to platform-specific storage/hydration (AuthStore for MobX or local storage for web). This adapter must be feature-complete: isInitialized/isReady, getAccessToken, isTokenExpired, hasRefreshToken, isRefreshing, refreshTokens, clearAuth.
2. Implement a canary rollout: replace platform refresh usage in low-risk modules (e.g., notification polling) and verify behavior before switching critical flows (message sending, file upload).
3. Defer unrelated build fixes. Treat the production build failures as a separate triage item — they block end-to-end verification but do not prevent rolling out the shared AuthProvider in stages.
4. Add diagnostics: structured logs for token refresh attempts (success/failure), queue lengths, and auth hydration events to aid post-deploy debugging.

Next actions performed in this change
------------------------------------
- Create this findings.md (current file)
- Create proposal.md (change overview)
- Create design.md and tasks.md per the change artifact flow
