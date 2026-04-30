## Why

The system is experiencing critical stability issues: P2037 database connection errors, 401 authentication race conditions causing request spam, notification count duplication showing double values, and poor desktop UX with content stretching on large monitors. These issues are causing production instability and degraded user experience.

## What Changes

- Implement authentication gatekeeper in Axios interceptor to queue requests during token refresh
- Add request queue system to prevent 401 spam during initialization
- Centralize notification count loading exclusively in `useInitNotifications`
- Remove all redundant notification loading from `Navbar` and `NotificationsList`
- Implement timestamp-based deduplication for notification updates
- Redesign Home screen with proper 3-column desktop grid layout (Sidebar + Feed + Panel)
- Add responsive breakpoints for 1080p, 1440p, and 4K monitors
- Add defensive error handling for Firebase initialization in push notifications
- Verify Prisma connection pooling in WebSocket handlers

## Capabilities

### New Capabilities
- `auth-request-gatekeeper`: Authentication-aware request interceptor that queues API calls during token refresh and initialization
- `desktop-responsive-grid`: Three-column responsive layout for desktop with proper max-widths and spacing
- `notification-timestamp-deduplication`: Timestamp-based system to prevent duplicate notification count updates

### Modified Capabilities
- `notification-count-display`: Update to use single source of truth with WebSocket-based updates only
- `api-error-handling`: Enhanced error handling to prevent 401 spam and graceful degradation

## Impact

**Frontend Files**:
- `Frontend/src/constants/api.ts` - Add request queue and gatekeeper logic
- `Frontend/src/components/Navbar.tsx` - Remove notification loading
- `Frontend/src/features/notifications/components/NotificationsList.tsx` - Remove loading logic
- `Frontend/src/features/notifications/store/notifications.store.ts` - Add timestamp tracking
- `Frontend/src/features/notifications/hooks/useInitNotifications.ts` - Sole loading point
- `Frontend/app/(tabs)/index.tsx` - Implement 3-column desktop grid

**Backend Files**:
- `Backend/src/messages/messages.gateway.ts` - Verify Prisma injection (no changes needed)
- `Backend/src/notifications/notifications.service.ts` - Add defensive error handling

**Benefits**:
- Eliminates 401 error spam during app initialization
- Fixes notification count duplication (shows correct value)
- Prevents P2037 database connection exhaustion
- Provides professional desktop UX with proper layout
- Maintains all 316 backend tests passing
- Zero breaking changes to existing functionality
