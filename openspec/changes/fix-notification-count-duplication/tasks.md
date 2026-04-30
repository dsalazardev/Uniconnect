## 1. Update useUserNotifications Hook

- [ ] 1.1 Remove `useState` for local `unreadCount` state
- [ ] 1.2 Remove `setUnreadCount` from local state
- [ ] 1.3 Remove `loadUnreadCount` callback function
- [ ] 1.4 Remove `unreadCount` from return object
- [ ] 1.5 Remove initial `loadUnreadCount()` call from `useEffect`
- [ ] 1.6 Remove AppState listener for count reload
- [ ] 1.7 Update observer subscription to call global store method instead of local state
- [ ] 1.8 Update `markAsRead` to use global store `decreaseUnread()` for optimistic update
- [ ] 1.9 Update `markAllAsRead` to use global store `resetUnread()` for optimistic update
- [ ] 1.10 Update error handlers to reload count via global store method
- [ ] 1.11 Verify TypeScript compilation passes with no errors

## 2. Update NotificationsList Component

- [ ] 2.1 Remove `unreadCount` from `useUserNotifications` destructuring
- [ ] 2.2 Add `useNotificationsStore` hook to read count from global store
- [ ] 2.3 Remove `setUnreadCount` from `useNotificationsStore` destructuring
- [ ] 2.4 Remove `useEffect` that syncs local count to global store
- [ ] 2.5 Update component to read `unreadCount` directly from store
- [ ] 2.6 Verify component renders correctly with store value
- [ ] 2.7 Verify TypeScript compilation passes with no errors

## 3. Update Navbar Component

- [ ] 3.1 Remove `loadUnreadCount` function definition
- [ ] 3.2 Remove initial `useEffect` that calls `loadUnreadCount` on mount
- [ ] 3.3 Keep AppState listener but update to use global store method
- [ ] 3.4 Import `useNotificationsStore` if not already imported
- [ ] 3.5 Update AppState handler to call store's reload method
- [ ] 3.6 Verify Navbar reads count from global store only
- [ ] 3.7 Verify TypeScript compilation passes with no errors

## 4. Add Reload Method to Zustand Store (if needed)

- [ ] 4.1 Check if store needs a `reloadUnreadCount` method for AppState refresh
- [ ] 4.2 If needed, add method that calls API and updates store
- [ ] 4.3 Ensure method is properly typed
- [ ] 4.4 Verify TypeScript compilation passes with no errors

## 5. Testing and Verification

- [ ] 5.1 Test: Open app with authentication, verify count loads once
- [ ] 5.2 Test: Verify count displays correct value (not doubled)
- [ ] 5.3 Test: Mark single notification as read, verify count decrements by 1
- [ ] 5.4 Test: Mark all notifications as read, verify count resets to 0
- [ ] 5.5 Test: Background app and return to foreground, verify count refreshes
- [ ] 5.6 Test: Receive new notification via observer, verify count increments
- [ ] 5.7 Test: Unmount and remount NotificationsList, verify no duplicate API calls
- [ ] 5.8 Test: Open app without authentication, verify count is 0 with no API call
- [ ] 5.9 Verify no console errors or warnings
- [ ] 5.10 Verify all TypeScript strict mode checks pass

## 6. Documentation and Cleanup

- [ ] 6.1 Update comments in `useUserNotifications` to reflect new behavior
- [ ] 6.2 Update comments in `NotificationsList` to reflect store-only reading
- [ ] 6.3 Update comments in `Navbar` to reflect AppState refresh behavior
- [ ] 6.4 Remove any unused imports from modified files
- [ ] 6.5 Run linter and fix any issues
- [ ] 6.6 Commit changes with descriptive message
