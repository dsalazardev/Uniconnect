## MODIFIED Requirements

### Requirement: Single source of truth for notification count

The system SHALL load notification count exclusively through `useInitNotifications` hook in `AppRoot`.

#### Scenario: App initialization
- **WHEN** app mounts and `AppRoot` renders
- **THEN** `useInitNotifications` calls `fetchUnreadCount()` exactly once
- **THEN** no other component calls `fetchUnreadCount()` during initialization

#### Scenario: Component mounts after initialization
- **WHEN** `Navbar` or `NotificationsList` mounts
- **THEN** components read `unreadCount` from store
- **THEN** components do NOT call `fetchUnreadCount()`

#### Scenario: App returns to foreground
- **WHEN** app state changes from background to active
- **THEN** `Navbar` AppState listener calls `fetchUnreadCount()`
- **THEN** no other component calls `fetchUnreadCount()`

### Requirement: Remove redundant loading from Navbar

The system SHALL NOT load notification count on Navbar mount.

#### Scenario: Navbar mounts
- **WHEN** `Navbar` component mounts
- **THEN** no `useEffect` calls `fetchUnreadCount()`
- **THEN** `Navbar` reads `unreadCount` from store only

#### Scenario: Navbar AppState listener
- **WHEN** app returns to foreground
- **THEN** `Navbar` AppState listener calls `fetchUnreadCount()`
- **THEN** this is the ONLY time `Navbar` loads count

### Requirement: Remove redundant loading from NotificationsList

The system SHALL NOT load notification count in `NotificationsList` component.

#### Scenario: NotificationsList mounts
- **WHEN** `NotificationsList` component mounts
- **THEN** no `useEffect` calls `fetchUnreadCount()`
- **THEN** component reads `unreadCount` from store only

#### Scenario: NotificationsList displays count
- **WHEN** `NotificationsList` renders
- **THEN** component reads `unreadCount` directly from `useNotificationsStore`
- **THEN** no local state synchronization occurs

### Requirement: WebSocket-based real-time updates

The system SHALL update notification count via WebSocket events only.

#### Scenario: New notification received
- **WHEN** WebSocket emits new notification event
- **THEN** observer calls `fetchUnreadCount()`
- **THEN** store updates with new count
- **THEN** all components re-render with new value

#### Scenario: Notification marked as read
- **WHEN** user marks notification as read
- **THEN** optimistic update calls `decreaseUnread()`
- **THEN** API call persists change
- **THEN** on error, `fetchUnreadCount()` reloads correct value

## REMOVED Requirements

### Requirement: Load notification count on Navbar mount

**Reason**: Causes duplicate API calls and race conditions with `useInitNotifications`

**Migration**: Remove `useEffect` that calls `loadUnreadCount()` on mount. Keep only AppState listener for foreground refresh.

### Requirement: Synchronize local state to global store in NotificationsList

**Reason**: Creates unnecessary complexity and potential for desynchronization

**Migration**: Remove `useEffect` that syncs `unreadCount` from `useUserNotifications` to global store. Read directly from store instead.
