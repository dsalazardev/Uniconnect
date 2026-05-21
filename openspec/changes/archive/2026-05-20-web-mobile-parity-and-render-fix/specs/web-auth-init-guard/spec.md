## ADDED Requirements

### Requirement: Hooks wait for auth initialization before API calls

Page-level hooks SHALL await `authStore.isInitialized` before making their first API call to prevent silent failures when the Axios interceptor rejects uninitialized requests.

#### Scenario: Hook delays API call until auth is initialized
- **WHEN** a page hook mounts and `authStore.isInitialized` is `false`
- **THEN** the hook SHALL wait until `isInitialized` becomes `true` before firing any API requests

#### Scenario: Hook proceeds immediately when already initialized
- **WHEN** a page hook mounts and `authStore.isInitialized` is already `true`
- **THEN** the hook SHALL fire API requests immediately without delay

#### Scenario: Auth guard does not block unauthenticated requests
- **WHEN** a hook mounts and `authStore.isInitialized` is `true` but `authStore.accessToken` is `null`
- **THEN** the hook SHALL still proceed (the Axios interceptor handles the missing token separately)

### Requirement: Auth guard has reasonable timeout fallback

If `authStore.isInitialized` does not become true within a reasonable time (e.g., 5 seconds), the guard SHALL resolve anyway to prevent indefinite blocking.

#### Scenario: Timeout resolves the guard
- **WHEN** `authStore.isInitialized` remains `false` for more than 5 seconds
- **THEN** the guard SHALL resolve and the hook SHALL proceed (letting the Axios interceptor handle it)

### Requirement: Auth guard is applied consistently

The auth-init guard SHALL be applied to all page-level hooks that make authenticated API calls.

#### Scenario: Events hook applies guard
- **WHEN** `useEvents()` mount-triggered `loadEvents()` is called
- **THEN** the guard SHALL be checked before the API call

#### Scenario: Groups hooks apply guard
- **WHEN** `useMyGroups()`, `useDiscoverGroups()`, or `useGroupDetail()` mount
- **THEN** the guard SHALL be checked before their first API call

#### Scenario: Messages hooks apply guard
- **WHEN** any messages hook mounts and makes an API call
- **THEN** the guard SHALL be checked before the API call
