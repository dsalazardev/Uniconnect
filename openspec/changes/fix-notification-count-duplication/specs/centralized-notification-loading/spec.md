## ADDED Requirements

### Requirement: Single initialization point for notification count

The system SHALL load the notification count exactly once during app initialization through `useInitNotifications` hook only.

#### Scenario: App loads with authenticated user
- **WHEN** app mounts with valid authentication token
- **THEN** `useInitNotifications` calls `getUnreadCount()` API exactly once
- **THEN** result is stored in global Zustand store
- **THEN** no other components call `getUnreadCount()` during initialization

#### Scenario: App loads without authentication
- **WHEN** app mounts without authentication token
- **THEN** `useInitNotifications` sets count to 0 in global store
- **THEN** no API call is made

### Requirement: Prevent duplicate API calls

The system SHALL prevent multiple components from independently loading notification count.

#### Scenario: Multiple components mount simultaneously
- **WHEN** `AppRoot`, `Navbar`, and `NotificationsList` mount at the same time
- **THEN** only `useInitNotifications` in `AppRoot` calls the API
- **THEN** `Navbar` and `NotificationsList` read from global store only
- **THEN** total API calls equals 1

#### Scenario: Component remounts after initialization
- **WHEN** `NotificationsList` unmounts and remounts
- **THEN** no additional API call is made
- **THEN** component reads current value from global store

### Requirement: Foreground refresh behavior

The system SHALL refresh notification count when app returns to foreground.

#### Scenario: App returns to foreground
- **WHEN** app state changes from background to active
- **THEN** `Navbar` AppState listener triggers count reload
- **THEN** reload uses same logic as initial load
- **THEN** updated count is stored in global store

#### Scenario: App stays in foreground
- **WHEN** app remains in active state
- **THEN** no automatic count reloads occur
- **THEN** count only updates via observer notifications or manual actions
