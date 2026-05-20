## ADDED Requirements

### Requirement: Protected API calls SHALL wait for auth hydration
The system SHALL prevent Axios requests to protected endpoints from being sent until the auth state is fully hydrated from storage and a valid access token is available.

#### Scenario: Notification badge fires during cold start
- **WHEN** the app launches and `AuthStore.isInitialized` is `false` (auth still hydrating from SecureStore)
- **THEN** the notification badge component's API call SHALL be queued/deferred, NOT sent immediately
- **AND** no "Network Error" SHALL be logged due to missing token

#### Scenario: Auth hydrates before API call timeout
- **WHEN** `AuthStore.isInitialized` becomes `true` AND `AuthStore.accessToken` is available
- **THEN** any deferred API calls SHALL be sent with the valid token attached
- **AND** the request interceptor SHALL allow new requests to pass through

#### Scenario: Auth hydrates but no session exists
- **WHEN** `AuthStore.isInitialized` becomes `true` AND `AuthStore.accessToken` is `null` (no stored session)
- **THEN** protected API calls SHALL NOT be sent (user is not authenticated)
- **AND** components SHOULD handle the absence gracefully (show login prompt, not error)

#### Scenario: Auth-ready guard in Mobile request interceptor
- **WHEN** `api.interceptors.request.use()` is invoked
- **THEN** the interceptor SHALL check `authStore.isInitialized && !!authStore.accessToken`
- **AND** if not ready, SHALL return a rejected promise or queue the request
- **AND** SHALL NOT send a bare/unauthenticated request to the backend

### Requirement: AuthProvider interface in shared SHALL support isReady
The `AuthProvider` interface in `shared/src/api/client.ts` SHALL include an `isReady` callback that returns `boolean`.

#### Scenario: createApiClient request interceptor checks isReady
- **WHEN** a request is intercepted by `createApiClient()`'s request interceptor
- **THEN** it SHALL call `authProvider.isReady()` before attaching the token
- **AND** if `isReady()` returns `false`, the request SHALL be deferred
- **AND** if `isReady()` returns `true`, the request SHALL proceed normally
