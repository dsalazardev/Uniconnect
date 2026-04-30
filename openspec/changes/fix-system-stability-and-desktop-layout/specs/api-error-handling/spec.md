## MODIFIED Requirements

### Requirement: Prevent 401 error spam during initialization

The system SHALL prevent API requests from generating 401 errors during authentication initialization.

#### Scenario: Requests during initialization
- **WHEN** API requests are made while `authStore.isInitialized = false`
- **THEN** requests are queued instead of sent
- **THEN** no 401 errors are generated

#### Scenario: Requests after initialization
- **WHEN** API requests are made after `authStore.isInitialized = true`
- **THEN** requests are sent immediately with token
- **THEN** 401 errors only occur for genuinely unauthorized requests

### Requirement: Graceful degradation for Firebase errors

The system SHALL handle Firebase initialization errors without crashing the app.

#### Scenario: Firebase not initialized
- **WHEN** push notification registration is attempted
- **THEN** Firebase initialization error is caught
- **THEN** error is logged as warning
- **THEN** app continues without push notifications

#### Scenario: Firebase initialization succeeds
- **WHEN** push notification registration is attempted
- **THEN** Firebase token is obtained
- **THEN** token is registered with backend
- **THEN** push notifications are enabled

### Requirement: Handle network errors gracefully

The system SHALL provide user-friendly error messages for network failures.

#### Scenario: Network timeout
- **WHEN** API request times out after 10 seconds
- **THEN** user sees "Connection timeout" message
- **THEN** user can retry the request

#### Scenario: Network unavailable
- **WHEN** device has no internet connection
- **THEN** user sees "No internet connection" message
- **THEN** app continues to function with cached data

### Requirement: Retry logic for transient errors

The system SHALL automatically retry requests that fail with transient errors.

#### Scenario: 503 Service Unavailable
- **WHEN** API returns 503 error
- **THEN** request is retried after 1 second
- **THEN** maximum 3 retry attempts
- **THEN** user sees error after final failure

#### Scenario: Connection reset
- **WHEN** connection is reset during request
- **THEN** request is retried immediately
- **THEN** maximum 2 retry attempts
- **THEN** user sees error after final failure

## ADDED Requirements

### Requirement: Defensive error handling in notification service

The system SHALL handle errors in notification operations without crashing.

#### Scenario: Database query fails
- **WHEN** `getUnreadCount()` database query fails
- **THEN** error is logged
- **THEN** method returns `{ count: 0 }`
- **THEN** app continues to function

#### Scenario: Invalid user ID
- **WHEN** `getUnreadCount()` is called with invalid user ID
- **THEN** error is logged
- **THEN** method returns `{ count: 0 }`
- **THEN** no exception is thrown
