# Design: Auth Unification via @uniconnect/shared ApiClient

Overview
--------
This design prescribes a migration path to unify authentication across Web and Mobile by adopting the shared createApiClient/AuthProvider pattern already implemented in @uniconnect/shared. The goal is to provide a single source of truth for token refresh behavior and to remove platform-specific ad-hoc implementations.

Core Principles
---------------
- Dependency Injection: Services consume an AxiosInstance created by createApiClient({ authProvider, baseURL, ... }) and do not access auth stores directly.
- Adapter Pattern: Each platform implements an AuthProvider adapter that translates platform storage and lifecycle into the AuthProvider interface.
- Incremental Rollout: Replace platform-specific refresh logic module-by-module and validate with smoke tests before global switch.
- Safety: Preserve isInitialized/isReady semantics so unauthenticated early requests still work.

Components
-----------
1. Shared Api Client (existing)
   - Location: Frontend/shared/src/api/client.ts
   - Behaviour: token injection, mutexed refresh, 401 queueing, FEN validation

2. Platform AuthProvider Adapters (new)
   - Web: implements AuthProvider using AuthStore (MobX or local storage) and AuthService for refreshTokens()
   - Mobile: implements AuthProvider using SecureStore/AsyncStorage and mobile AuthController for refreshTokens()
   - Responsibilities:
     - Provide synchronous getters for access token (getAccessToken)
     - Expose isInitialized/isReady flags to block requests before hydration
     - Implement refreshTokens() that returns TokenRefreshResult and atomically updates platform store
     - Expose clearAuth() to wipe tokens and call platform logout flows

3. Canary Services
   - Identify low-risk services to switch to shared client first: NotificationsService polling, ProgramsService (read-only), StudentsService (read-only)
   - Validate refresh and auth-ready flow with these services before switching critical modules (MessagesService, FilesService)

4. Observability
   - Add structured logging in shared client (debug flag) capturing: refresh start/finish, queue length, refresh result.code/status
   - Add metrics counters (optional): refresh_attempts, refresh_failures, queue_size

API Contracts
-------------
1. AuthProvider (shared) — must be implemented exactly per shared/src/api/client.ts interface.

2. TokenRefreshResult shape:
   { success: boolean, tokens?: { accessToken: string, refreshToken?: string }, errorCode?: string, message?: string, statusCode?: number }

Migration Plan (High level)
--------------------------
1. Implement platform AuthProvider adapters and unit tests for edge cases (missing refresh token, expired token, hydration not ready).
2. Wire createApiClient in platform bootstrapping (Web: AppRoot, Mobile: App initialization) using the adapter.
3. Replace simple axios instances in low-risk services with the shared client.
4. Monitor, then update critical services.
5. Remove duplicated refresh logic once all services rely on shared client.

Constraints & Safeguards
-----------------------
- Do not modify backend APIs.
- Preserve existing login/logout UX; logout must call POST /auth/logout before clearAuth.
- PKCE handling remains a web concern; adapters must not change PKCE flow, only consumption of tokens post-exchange.
