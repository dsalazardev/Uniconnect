## MODIFIED Requirements

### Requirement: Display notification count from global store

The system SHALL display notification count by reading directly from Zustand global store, not from local component state.

#### Scenario: Component displays count on mount
- **WHEN** `NotificationIcon` or `NotificationsList` mounts
- **THEN** component reads `unreadCount` from `useNotificationsStore`
- **THEN** component does NOT maintain local state for count
- **THEN** displayed value matches global store value exactly

#### Scenario: Count updates in global store
- **WHEN** global store `unreadCount` changes
- **THEN** all components reading from store re-render automatically
- **THEN** displayed count updates to new value
- **THEN** no manual synchronization is required

### Requirement: Remove local state management

The system SHALL NOT maintain local state for notification count in hooks or components.

#### Scenario: useUserNotifications hook usage
- **WHEN** `useUserNotifications` hook is called
- **THEN** hook does NOT create local state with `useState`
- **THEN** hook does NOT return `unreadCount` value
- **THEN** components must read count from global store directly

#### Scenario: NotificationsList component usage
- **WHEN** `NotificationsList` component mounts
- **THEN** component does NOT sync local state to global store
- **THEN** component does NOT have `useEffect` for count synchronization
- **THEN** component reads count from global store only

### Requirement: Preserve notification marking behavior

The system SHALL maintain existing notification marking and navigation logic without changes.

#### Scenario: User marks notification as read
- **WHEN** user marks a notification as read
- **THEN** `markAsRead` function executes optimistic update
- **THEN** global store `decreaseUnread()` is called
- **THEN** API call is made to persist change
- **THEN** on error, count is reloaded from API

#### Scenario: User marks all as read
- **WHEN** user marks all notifications as read
- **THEN** `markAllAsRead` function executes optimistic update
- **THEN** global store `resetUnread()` is called
- **THEN** API call is made to persist change
- **THEN** on error, count is reloaded from API

### Requirement: Preserve observer pattern

The system SHALL maintain existing notification observer subscriptions for real-time updates.

#### Scenario: New notification received
- **WHEN** notification observer emits change event
- **THEN** subscribed components reload count from API
- **THEN** global store is updated with new count
- **THEN** all components display updated count

#### Scenario: Component subscribes to observer
- **WHEN** component mounts and subscribes to observer
- **THEN** subscription returns cleanup function
- **THEN** cleanup function is called on unmount
- **THEN** no memory leaks occur
