## Context

**Current State**:
- Axios interceptor allows requests during auth initialization, causing 401 spam
- Multiple components (`AppRoot`, `Navbar`, `NotificationsList`) independently load notification count
- Home screen uses single-column layout that stretches poorly on desktop
- No request queueing during token refresh
- Firebase push notification errors crash the app

**Problems**:
1. Race condition: API calls fire before `authStore.isInitialized = true`
2. Notification count duplicates because multiple sources update the same value
3. Desktop users see stretched, unprofessional layout
4. P2037 errors suggest connection pool exhaustion (though Prisma is singleton)

**Constraints**:
- Must maintain all 316 backend tests passing
- Zero-Any policy (TypeScript strict mode)
- Cannot break existing mobile layout
- Must preserve WebSocket real-time updates

## Goals / Non-Goals

**Goals:**
- Eliminate 401 error spam during app initialization
- Fix notification count duplication (single source of truth)
- Provide professional 3-column desktop layout
- Prevent Firebase errors from crashing app
- Maintain backward compatibility

**Non-Goals:**
- Refactoring entire authentication system
- Changing backend notification logic
- Redesigning mobile layout
- Adding new notification features
- Modifying WebSocket architecture

## Decisions

### Decision 1: Request Queue with Gatekeeper Pattern

**Choice**: Implement request queue in Axios interceptor that blocks during initialization

**Rationale**:
- Prevents 401 spam by waiting for auth to complete
- Queues requests instead of failing them
- Transparent to components (no code changes needed)
- Handles both initialization and token refresh

**Implementation**:
```typescript
// Frontend/src/constants/api.ts
let requestQueue: Array<{
  config: InternalAxiosRequestConfig;
  resolve: (config: InternalAxiosRequestConfig) => void;
  reject: (error: any) => void;
}> = [];

let isProcessingQueue = false;

api.interceptors.request.use(
  async (config) => {
    // Wait for auth initialization
    const maxWait = 5000;
    const startTime = Date.now();
    while (!authStore.isInitialized && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // If refreshing, queue the request
    if (authStore.isRefreshing) {
      return new Promise((resolve, reject) => {
        requestQueue.push({ config, resolve, reject });
      });
    }

    // Add token if available
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    return config;
  }
);
```

**Alternatives Considered**:
- Retry logic → Doesn't prevent initial 401s
- Component-level guards → Requires changes in every component
- Global loading state → Blocks entire UI unnecessarily

### Decision 2: Timestamp-Based Notification Deduplication

**Choice**: Add `lastUpdated` timestamp to notification store to ignore stale updates

**Rationale**:
- Prevents race conditions between WebSocket and REST
- Allows multiple sources to update without duplication
- Simple to implement and understand
- No breaking changes to existing code

**Implementation**:
```typescript
// Frontend/src/features/notifications/store/notifications.store.ts
export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  lastUpdated: 0,

  fetchUnreadCount: async (token: string) => {
    const timestamp = Date.now();
    const { count } = await notificationsService.getUnreadCount(token);
    
    // Only update if this is newer than last update
    if (timestamp > get().lastUpdated) {
      set({ unreadCount: count, lastUpdated: timestamp });
    }
  },
}));
```

**Alternatives Considered**:
- Debounce updates → Delays real-time updates
- Lock mechanism → Complex and error-prone
- Remove WebSocket updates → Loses real-time capability

### Decision 3: Three-Column Desktop Grid with Flexbox

**Choice**: Use flexbox with fixed sidebars and flexible center column

**Rationale**:
- Flexbox provides better browser support than CSS Grid for this layout
- Fixed sidebar widths prevent content shifting
- Max-width on center prevents over-stretching
- Responsive breakpoints handle different monitor sizes

**Implementation**:
```typescript
// Frontend/app/(tabs)/index.tsx
const styles = StyleSheet.create({
  desktopContainer: {
    flexDirection: 'row',
    maxWidth: 1600, // Prevent stretching on 4K
    marginHorizontal: 'auto',
  },
  sidebar: {
    width: 250,
    borderRightWidth: 1,
    borderRightColor: '#2a2a2a',
  },
  feed: {
    flex: 1,
    maxWidth: 800, // Optimal reading width
    paddingHorizontal: 24,
  },
  panel: {
    width: 300,
    borderLeftWidth: 1,
    borderLeftColor: '#2a2a2a',
  },
});
```

**Breakpoints**:
- Mobile (< 768px): Single column, no sidebars
- Tablet (768-1024px): Single column with padding
- Desktop (1024-1440px): 3 columns, compact spacing
- Large Desktop (> 1440px): 3 columns, max-width 1600px

**Alternatives Considered**:
- CSS Grid → Less browser support, more complex
- Percentage widths → Content shifts unpredictably
- Single column for all → Poor desktop UX

### Decision 4: Remove Redundant Notification Loading

**Choice**: Delete all `useEffect` loading logic from `Navbar` and `NotificationsList`

**Rationale**:
- Single source of truth prevents duplication
- `useInitNotifications` in `AppRoot` is sufficient
- Components read from store reactively
- WebSocket updates handle real-time changes

**Implementation**:
```typescript
// Navbar.tsx - REMOVE
useEffect(() => {
  if (!token) return;
  loadUnreadCount(); // ❌ DELETE THIS
}, [token]);

// NotificationsList.tsx - REMOVE
useEffect(() => {
  setUnreadCount(unreadCount); // ❌ DELETE THIS
}, [unreadCount, setUnreadCount]);
```

**Alternatives Considered**:
- Keep loading but add deduplication → Still causes unnecessary API calls
- Coordinate loading with flags → Complex and error-prone

### Decision 5: Defensive Firebase Error Handling

**Choice**: Wrap Firebase operations in try/catch with fallback

**Rationale**:
- Firebase initialization can fail in development
- Should not crash entire app
- Graceful degradation is acceptable for push notifications

**Implementation**:
```typescript
// useRegisterPushToken
try {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await notificationsService.registerExpoPushToken({ token, platform: 'expo' });
  }
} catch (error) {
  console.warn('Push notification registration failed:', error);
  // Continue without push notifications
}
```

**Alternatives Considered**:
- Fail fast → Crashes app unnecessarily
- Retry logic → Delays app startup
- Conditional initialization → Complex configuration

## Risks / Trade-offs

**Risk**: Request queue could delay critical requests  
→ **Mitigation**: 5-second timeout on auth wait, queue only during refresh (< 2 seconds)

**Risk**: Timestamp deduplication could ignore legitimate updates  
→ **Mitigation**: Timestamp granularity is milliseconds, race window is < 100ms

**Risk**: Desktop layout could break on unusual screen sizes  
→ **Mitigation**: Max-width prevents over-stretching, min-width triggers mobile layout

**Risk**: Removing Navbar loading could delay count updates  
→ **Mitigation**: AppState listener in Navbar still refreshes on foreground

**Trade-off**: Request queue adds complexity to interceptor  
→ **Impact**: Acceptable - prevents 401 spam and improves UX significantly

**Trade-off**: Desktop layout requires more CSS  
→ **Impact**: Minimal - ~50 lines of styles, no new dependencies

## Migration Plan

**Deployment Steps**:
1. Deploy backend changes (defensive error handling) - no breaking changes
2. Deploy frontend changes (request queue, notification fixes, desktop layout)
3. Monitor logs for 401 errors (should drop to zero)
4. Monitor notification count accuracy
5. Test desktop layout on various screen sizes

**Rollback Strategy**:
- Changes are isolated to specific files
- Git revert restores previous behavior immediately
- No database migrations required
- No API contract changes

**Testing**:
- Unit tests: Request queue logic, timestamp deduplication
- Integration tests: Auth initialization flow, notification loading
- Manual tests: Desktop layout on 1080p, 1440p, 4K monitors
- Regression tests: All 316 backend tests must pass

## Open Questions

None - design is well-defined with clear implementation path.
