## Context

**Current State**: Three components independently load notification count:
1. `AppRoot` via `useInitNotifications` - loads on mount
2. `Navbar` via direct `useEffect` - loads on mount + AppState changes
3. `NotificationsList` via `useUserNotifications` - maintains local state, syncs to global store

**Problem**: `useUserNotifications` uses `useState` for local count, then `NotificationsList` syncs it to Zustand store via `useEffect`. This creates race conditions when multiple components update the store simultaneously.

**Constraints**:
- Must preserve existing notification observer pattern for real-time updates
- Must maintain AppState listener for foreground refresh
- Cannot break existing notification marking/navigation logic
- Zero-Any policy and TypeScript strict mode required

## Goals / Non-Goals

**Goals:**
- Single source of truth: Zustand store only
- Single initialization point: `useInitNotifications` only
- Eliminate local state in `useUserNotifications`
- Reduce API calls from 3 to 1 per app load
- Fix count duplication bug

**Non-Goals:**
- Changing notification observer architecture
- Modifying backend API
- Refactoring notification marking logic
- Adding new notification features

## Decisions

### Decision 1: Remove Local State from `useUserNotifications`

**Choice**: Hook reads from global store instead of maintaining local state

**Rationale**: 
- Eliminates local-to-global synchronization that causes race conditions
- Simplifies hook logic - no state management needed
- Components already have access to global store via `useNotificationsStore`

**Alternatives Considered**:
- Keep local state, add debounce → Doesn't fix root cause, adds complexity
- Use React Context → Unnecessary, Zustand already provides global state

### Decision 2: Centralize Loading in `useInitNotifications`

**Choice**: Only `useInitNotifications` calls `getUnreadCount()` on mount

**Rationale**:
- Single initialization point prevents duplicate API calls
- `Navbar` and `NotificationsList` read from store, don't load
- Observer pattern handles real-time updates after initialization

**Alternatives Considered**:
- Each component loads independently → Current broken behavior
- Load in Navbar only → Inconsistent, AppRoot is better initialization point

### Decision 3: Preserve AppState Listener in `Navbar`

**Choice**: Keep AppState listener but call store method instead of API directly

**Rationale**:
- Foreground refresh is valid use case (user may have read notifications elsewhere)
- Moving to `useInitNotifications` would require passing AppState logic to AppRoot
- Navbar already handles AppState for connection requests

**Implementation**: `Navbar` calls `loadUnreadCount()` helper that uses `useInitNotifications` logic

### Decision 4: Keep Observer Subscriptions

**Choice**: Maintain existing observer subscriptions in `useUserNotifications`

**Rationale**:
- Observer pattern correctly handles real-time notification events
- No duplication issue - observer just triggers reload when needed
- Removing would break real-time updates

## Risks / Trade-offs

**Risk**: Breaking existing notification marking logic  
→ **Mitigation**: Only change count loading, preserve all marking/navigation logic in `useUserNotifications`

**Risk**: AppState refresh in Navbar may still cause extra API call  
→ **Mitigation**: Acceptable - foreground refresh is intentional, not a bug. Only happens when app returns to foreground.

**Trade-off**: `useUserNotifications` no longer returns `unreadCount`  
→ **Impact**: Components must read from store directly. Minimal change - most already do this.

**Trade-off**: Slightly more coupling to Zustand store  
→ **Impact**: Acceptable - store is already the source of truth, making it explicit is cleaner.

## Migration Plan

**Deployment Steps**:
1. Update `useUserNotifications` - remove local state, keep other logic
2. Update `NotificationsList` - remove sync `useEffect`, read from store
3. Update `Navbar` - remove redundant count loading
4. Test: Verify count loads once on mount, updates on mark-as-read, refreshes on foreground

**Rollback Strategy**: 
- Changes are isolated to 3 files
- Git revert restores previous behavior immediately
- No database or API changes required

**Testing**:
- Manual: Open app, verify count shows correct value (not doubled)
- Manual: Mark notification as read, verify count decrements by 1
- Manual: Background app, return to foreground, verify count refreshes
- Manual: Receive new notification, verify count increments

## Open Questions

None - design is straightforward refactoring with clear implementation path.
