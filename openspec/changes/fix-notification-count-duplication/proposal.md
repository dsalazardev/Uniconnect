## Why

The notification counter in the UI displays double the actual value returned by the backend API. When the backend returns `{ count: 5 }`, the UI shows `10`. This occurs because multiple components independently load the notification count, and `useUserNotifications` maintains a local state that syncs to the global store, causing race conditions and duplicate updates.

## What Changes

- Remove local state from `useUserNotifications` hook - read directly from global Zustand store
- Centralize notification count loading in `useInitNotifications` only
- Remove redundant count loading from `Navbar` component
- Eliminate local-to-global state synchronization in `NotificationsList`
- Ensure single source of truth for notification count

## Capabilities

### New Capabilities
- `centralized-notification-loading`: Single initialization point for notification count that prevents duplicate API calls and race conditions

### Modified Capabilities
- `notification-count-display`: Update existing notification display logic to read from global store only, removing local state management

## Impact

**Affected Files**:
- `Frontend/src/features/notifications/hooks/useUserNotifications.ts` - Remove local state, read from global store
- `Frontend/src/components/Navbar.tsx` - Remove redundant count loading
- `Frontend/src/features/notifications/components/NotificationsList.tsx` - Remove local-to-global sync

**Benefits**:
- Reduces API calls from 3 to 1 per app load
- Eliminates race conditions between components
- Simplifies state management with single source of truth
- Fixes notification count duplication bug
