## ADDED Requirements

### Requirement: Block requests during authentication initialization

The system SHALL prevent API requests from being sent while authentication is initializing.

#### Scenario: App starts with stored session
- **WHEN** app mounts and `authStore.isInitialized = false`
- **THEN** all API requests are queued
- **THEN** requests are sent after `authStore.isInitialized = true`

#### Scenario: App starts without session
- **WHEN** app mounts with no stored credentials
- **THEN** authentication completes within 5 seconds
- **THEN** queued requests are sent without authentication headers

#### Scenario: Initialization timeout
- **WHEN** authentication initialization takes longer than 5 seconds
- **THEN** queued requests are sent anyway
- **THEN** requests without valid token receive 401 and trigger login flow

### Requirement: Queue requests during token refresh

The system SHALL queue API requests while access token is being refreshed.

#### Scenario: Token expires during active session
- **WHEN** access token expires and `authStore.isRefreshing = true`
- **THEN** new API requests are added to queue
- **THEN** queued requests are not sent until refresh completes

#### Scenario: Token refresh succeeds
- **WHEN** token refresh completes successfully
- **THEN** all queued requests are sent with new token
- **THEN** queue is cleared after processing

#### Scenario: Token refresh fails
- **WHEN** token refresh fails
- **THEN** all queued requests are rejected with error
- **THEN** user is redirected to login screen
- **THEN** queue is cleared

### Requirement: Preserve request order

The system SHALL maintain the original order of queued requests.

#### Scenario: Multiple requests queued
- **WHEN** 5 requests are queued during token refresh
- **THEN** requests are sent in FIFO order
- **THEN** each request receives its own response

#### Scenario: Request timeout
- **WHEN** queued request waits longer than 10 seconds
- **THEN** request is rejected with timeout error
- **THEN** other queued requests continue processing

### Requirement: Add authentication headers automatically

The system SHALL add Bearer token to all requests when available.

#### Scenario: Request with valid token
- **WHEN** API request is made and `authStore.accessToken` exists
- **THEN** `Authorization: Bearer <token>` header is added
- **THEN** request is sent immediately

#### Scenario: Request without token
- **WHEN** API request is made and `authStore.accessToken` is null
- **THEN** no Authorization header is added
- **THEN** request is sent immediately (may receive 401)
