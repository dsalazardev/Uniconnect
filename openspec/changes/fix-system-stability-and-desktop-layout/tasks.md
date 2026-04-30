## 1. Auth Request Gatekeeper Implementation

- [ ] 1.1 Add request queue data structure to `Frontend/src/constants/api.ts`
- [ ] 1.2 Add `isProcessingQueue` flag to prevent concurrent queue processing
- [ ] 1.3 Implement `waitForAuthInitialization()` helper with 5-second timeout
- [ ] 1.4 Implement `queueRequest()` helper to add requests to queue
- [ ] 1.5 Implement `processQueue()` helper to send queued requests after refresh
- [ ] 1.6 Update request interceptor to wait for `authStore.isInitialized`
- [ ] 1.7 Update request interceptor to queue requests when `authStore.isRefreshing = true`
- [ ] 1.8 Update response interceptor to call `processQueue()` after successful refresh
- [ ] 1.9 Update response interceptor to reject queue on refresh failure
- [ ] 1.10 Add logging for queue operations (add, process, reject)
- [ ] 1.11 Test: Verify requests are queued during initialization
- [ ] 1.12 Test: Verify requests are sent after initialization completes
- [ ] 1.13 Test: Verify no 401 errors during app startup

## 2. Notification Timestamp Deduplication

- [ ] 2.1 Add `lastUpdated: number` field to `NotificationsState` interface
- [ ] 2.2 Initialize `lastUpdated` to 0 in store
- [ ] 2.3 Update `fetchUnreadCount()` to capture timestamp before API call
- [ ] 2.4 Update `fetchUnreadCount()` to check if timestamp > `lastUpdated` before updating
- [ ] 2.5 Update `fetchUnreadCount()` to set `lastUpdated` when updating count
- [ ] 2.6 Update `decreaseUnread()` to set `lastUpdated` to current time
- [ ] 2.7 Update `resetUnread()` to set `lastUpdated` to current time
- [ ] 2.8 Update `setUnreadCount()` to set `lastUpdated` to current time
- [ ] 2.9 Test: Verify older updates are ignored
- [ ] 2.10 Test: Verify newer updates are accepted
- [ ] 2.11 Test: Verify race conditions between WebSocket and REST are handled

## 3. Remove Redundant Notification Loading

- [ ] 3.1 Open `Frontend/src/components/Navbar.tsx`
- [ ] 3.2 Remove `loadUnreadCount` function definition
- [ ] 3.3 Remove initial `useEffect` that calls `loadUnreadCount` on mount
- [ ] 3.4 Keep AppState listener but verify it uses store's `fetchUnreadCount`
- [ ] 3.5 Remove unused imports (`notificationsService`, `notificationObserver`)
- [ ] 3.6 Open `Frontend/src/features/notifications/components/NotificationsList.tsx`
- [ ] 3.7 Remove `setUnreadCount` from store destructuring
- [ ] 3.8 Remove `unreadCount` from `useUserNotifications` destructuring
- [ ] 3.9 Remove `useEffect` that syncs local count to global store
- [ ] 3.10 Add `useNotificationsStore` to read `unreadCount` directly
- [ ] 3.11 Test: Verify Navbar doesn't load count on mount
- [ ] 3.12 Test: Verify NotificationsList reads from store only
- [ ] 3.13 Test: Verify count loads exactly once on app startup

## 4. Desktop Responsive Grid Layout

- [ ] 4.1 Open `Frontend/app/(tabs)/index.tsx`
- [ ] 4.2 Import `useResponsive` hook
- [ ] 4.3 Add `isMobile`, `isTablet`, `isDesktop` from `useResponsive()`
- [ ] 4.4 Create `DesktopSidebar` component with navigation links
- [ ] 4.5 Create `DesktopPanel` component with featured groups
- [ ] 4.6 Add conditional rendering: mobile layout when `isMobile || isTablet`
- [ ] 4.7 Add conditional rendering: desktop layout when `isDesktop`
- [ ] 4.8 Create `desktopContainer` style with flexDirection row and maxWidth 1600
- [ ] 4.9 Create `sidebar` style with width 250px and border
- [ ] 4.10 Create `feed` style with flex 1, maxWidth 800px, and padding
- [ ] 4.11 Create `panel` style with width 300px and border
- [ ] 4.12 Wrap existing content in desktop grid structure
- [ ] 4.13 Add horizontal centering with marginHorizontal auto
- [ ] 4.14 Test: Verify 3-column layout on desktop (≥ 1024px)
- [ ] 4.15 Test: Verify single column on tablet (768-1023px)
- [ ] 4.16 Test: Verify single column on mobile (< 768px)
- [ ] 4.17 Test: Verify max-width prevents stretching on 4K monitors

## 5. useResponsive Hook Enhancement

- [ ] 5.1 Open `Frontend/src/hooks/useResponsive.ts`
- [ ] 5.2 Verify breakpoints: mobile < 768, tablet 768-1023, desktop ≥ 1024
- [ ] 5.3 Add `isLargeDesktop` for screens ≥ 1440px (if not exists)
- [ ] 5.4 Add `is4K` for screens ≥ 2560px (if not exists)
- [ ] 5.5 Test: Verify breakpoints trigger correctly on resize

## 6. Firebase Error Handling

- [ ] 6.1 Open `Frontend/src/features/notifications/hooks/useNotifications.ts`
- [ ] 6.2 Locate `useRegisterPushToken` hook
- [ ] 6.3 Wrap `registerForPushNotificationsAsync()` in try/catch
- [ ] 6.4 Log Firebase errors as warnings (not errors)
- [ ] 6.5 Continue app execution on Firebase failure
- [ ] 6.6 Test: Verify app doesn't crash when Firebase is not initialized
- [ ] 6.7 Test: Verify push notifications work when Firebase is initialized

## 7. Backend Defensive Error Handling

- [ ] 7.1 Open `Backend/src/notifications/notifications.service.ts`
- [ ] 7.2 Wrap `getUnreadCount()` query in try/catch
- [ ] 7.3 Return `{ count: 0 }` on error instead of throwing
- [ ] 7.4 Log error with context (userId, error message)
- [ ] 7.5 Wrap `findAllForUser()` query in try/catch
- [ ] 7.6 Return empty array on error instead of throwing
- [ ] 7.7 Test: Verify service handles database errors gracefully
- [ ] 7.8 Test: Verify all 316 backend tests still pass

## 8. Prisma Connection Verification

- [ ] 8.1 Open `Backend/src/messages/messages.gateway.ts`
- [ ] 8.2 Verify `PrismaService` is injected via constructor (not instantiated)
- [ ] 8.3 Verify no `new PrismaClient()` calls exist
- [ ] 8.4 Open `Backend/src/prisma/prisma.service.ts`
- [ ] 8.5 Verify `@Injectable()` decorator is present
- [ ] 8.6 Verify pool configuration: max 20 connections
- [ ] 8.7 Add logging of pool stats in `onModuleInit` (optional)
- [ ] 8.8 Test: Verify no P2037 errors occur under normal load

## 9. Integration Testing

- [ ] 9.1 Test: Start app and verify no 401 errors in console
- [ ] 9.2 Test: Verify notification count loads exactly once
- [ ] 9.3 Test: Verify notification count displays correct value (not doubled)
- [ ] 9.4 Test: Mark notification as read, verify count decrements by 1
- [ ] 9.5 Test: Receive new notification, verify count increments by 1
- [ ] 9.6 Test: Background app and return, verify count refreshes
- [ ] 9.7 Test: Resize window from mobile to desktop, verify layout changes
- [ ] 9.8 Test: Verify desktop layout on 1080p monitor
- [ ] 9.9 Test: Verify desktop layout on 1440p monitor
- [ ] 9.10 Test: Verify desktop layout on 4K monitor (max-width enforced)
- [ ] 9.11 Test: Verify sidebar navigation works
- [ ] 9.12 Test: Verify right panel groups are clickable

## 10. Documentation and Cleanup

- [ ] 10.1 Update comments in `api.ts` to explain request queue logic
- [ ] 10.2 Update comments in `notifications.store.ts` to explain timestamp deduplication
- [ ] 10.3 Update comments in `index.tsx` to explain desktop grid layout
- [ ] 10.4 Remove any unused imports from modified files
- [ ] 10.5 Run linter and fix any issues
- [ ] 10.6 Verify TypeScript compilation passes with no errors
- [ ] 10.7 Verify Zero-Any policy is maintained (no `any` types)
- [ ] 10.8 Create migration notes for deployment
- [ ] 10.9 Update AGENTS.md with new patterns (if applicable)
- [ ] 10.10 Commit changes with descriptive message

## 11. Backend Testing

- [ ] 11.1 Run backend test suite: `npm test`
- [ ] 11.2 Verify all 316 tests pass
- [ ] 11.3 Run backend build: `npm run build`
- [ ] 11.4 Verify build completes without errors
- [ ] 11.5 Test notification endpoints manually with Postman/curl
- [ ] 11.6 Verify `GET /notifications/unread-count` returns correct value
- [ ] 11.7 Verify error handling doesn't break existing functionality

## 12. Performance Verification

- [ ] 12.1 Monitor API call count on app startup (should be minimal)
- [ ] 12.2 Verify no duplicate calls to `/notifications/unread-count`
- [ ] 12.3 Monitor database connection pool usage
- [ ] 12.4 Verify no P2037 errors in backend logs
- [ ] 12.5 Test app performance on low-end devices
- [ ] 12.6 Verify desktop layout renders smoothly
- [ ] 12.7 Test scroll performance with large event/group lists
