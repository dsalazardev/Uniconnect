# Tasks: Implement Auth Unification (frontend-audit-auth-unify)

Note: This change is an audit + design + task creation. Do not run implementation steps until approved.

1) Implement Platform AuthProvider Adapters (3d)
   - Web adapter: src/features/auth/adapters/web-auth-provider.ts
     - Implements AuthProvider using AuthStore and AuthService
     - Unit tests for cases: token present, token expired, no refresh token, hydration false
   - Mobile adapter: src/features/auth/adapters/mobile-auth-provider.ts
     - Implements AuthProvider using SecureStore/AsyncStorage and mobile auth controller
     - Unit tests for same cases

2) Integrate createApiClient at App Bootstrap (1d)
   - Web: instantiate api = createApiClient({ baseURL: VITE_API_URL, authProvider: webAdapter, ... }) and provide to services/store factories
   - Mobile: same with EXPO_PUBLIC_API_URL and mobileAdapter

3) Canary rollout: switch low-risk services (2d)
   - NotificationsService, ProgramsService, StudentsService
   - Verify token refresh through logs and local smoke tests

4) Replace critical services (3d)
   - MessagesService, FilesService, GroupsService
   - Run manual smoke tests: message send/edit/delete, file upload/download, group join/accept

5) Remove duplicated refresh logic & cleanup (2d)
   - Remove ad-hoc refresh code from platform services
   - Update docs and AGENTS.md guidance to reference shared AuthProvider

6) Observability & Tests (2d)
   - Add structured logs and unit/integration tests for queueing behaviour
   - Add property-based tests for token conversion edge cases

7) Rollout checklist and smoke tests (1d)
   - Verify production build for web (address existing build blockers separately)
   - Run mobile debug builds and manual flows

Estimated total: 13 working days (parallelizable across platform engineers)
