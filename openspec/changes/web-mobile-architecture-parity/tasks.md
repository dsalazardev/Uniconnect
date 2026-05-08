## 1. Ratify Ad-hoc Fixes (G1-G6)

- [x] 1.1 Verify `refreshTokens()` in `web/src/constants/api.ts` calls `AuthService.refreshTokens()` and handles response correctly
- [x] 1.2 Verify PKCE `code_verifier` generation and `sessionStorage` round-trip in `useWebAuth.ts`
- [x] 1.3 Verify logout calls `POST /auth/logout` before `clearAuth()`
- [x] 1.4 Verify `@tanstack/react-query` and `socket.io-client` in `web/package.json`
- [x] 1.5 Verify all groups hooks import types from `groups/types/index.ts` barrel
- [x] 1.6 Verify `useChat.ts` imports for types and config resolve; note that `services/files.service.ts` is a **temporary web stub** to be superseded by shared extraction (Section 2)
- [x] 1.7 Verify `useEvents` hook exists and `EventsPage` wrapper connects store to UI

## 2. Extract Shared Services to @uniconnect/shared

### 2A. Shared FilesService

- [x] 2a.1 Create `shared/src/api/endpoints/files.ts` with `FILES_ENDPOINTS` constants (GET_DOWNLOAD_URL, UPLOAD, etc.)
- [x] 2a.2 Register `files.ts` in `shared/src/api/endpoints/index.ts` barrel
- [x] 2a.3 Extract platform-agnostic methods from mobile `FilesService` into `shared/src/services/files.service.ts`:
  - `validateFiles()` — pure validation logic
  - `getFileSize()` — size formatting utility
  - `getPresignedDownloadUrl(fileId)` — calls REST endpoint, returns URL
- [x] 2a.4 Export new `FilesService` from `shared/src/services/index.ts` barrel
- [x] 2a.5 **Refactor mobile**: update `mobile/src/features/messages/services/files.service.ts` to extend or compose the shared `FilesService`, keeping only platform-specific methods (`uploadFiles`, `downloadAndOpenFile`)
- [x] 2a.6 **Wire web**: update `web/src/features/messages/services/files.service.ts` to extend or compose the shared `FilesService`, keeping only platform-specific `downloadAndOpenFile()`

### 2B. Shared NotificationObserverService

- [x] 2b.1 Move `NotificationObserverService` from `mobile/src/features/notifications/services/notification-observer.service.ts` into `shared/src/services/notification-observer.service.ts`
- [x] 2b.2 Export from `shared/src/services/index.ts` barrel
- [x] 2b.3 **Refactor mobile**: update all imports in mobile from `'../services/notification-observer.service'` to `'@uniconnect/shared'`
- [x] 2b.4 **Wire web**: create `web/src/features/notifications/services/notification-observer.service.ts` as a thin re-export from `@uniconnect/shared` (or import directly in consumers)
- [x] 2b.5 Update web's `useRealtimeNotifications` and `useUserNotifications` hooks (or create them) to use the shared observer

## 3. Install New Dependencies

- [x] 3.1 Add `react-hot-toast` to `web/package.json`
- [x] 3.2 Add `lucide-react` to `web/package.json`
- [x] 3.3 Run `npm install` and verify no peer-dependency warnings

## 4. UI Design System — Elements

- [x] 4.1 Create `src/components/elements/Button.tsx` with variants (primary/secondary/danger), loading, and disabled states
- [x] 4.2 Create `src/components/elements/Input.tsx` with label, error state, and styling
- [x] 4.3 Create `src/components/elements/Modal.tsx` with overlay, close-on-click-outside, and visibility toggle
- [x] 4.4 Create `src/components/elements/index.ts` barrel export

## 5. Toast Notification System

- [x] 5.1 Install and configure `react-hot-toast` — add `<Toaster />` in Layout or AppRoot
- [x] 5.2 Rewrite `src/lib/toast.ts` to use `react-hot-toast` with success/error/info methods
- [x] 5.3 Verify existing `showToast` callers work without modification

## 6. Icon Library Migration

- [x] 6.1 Replace emoji icons with `lucide-react` in `EventCard.tsx` (Calendar, Clock, MapPin)
- [x] 6.2 Replace emoji icons with `lucide-react` in `EventDetail.tsx` (FileText, Calendar)
- [x] 6.3 Replace emoji icons with `lucide-react` in `MessageList.tsx` (MessageCircle)
- [x] 6.4 Replace remaining emoji icons across all web feature components (22 files)

## 7. Component Parity

- [x] 7.1 Create `AppRoot` component with loading/error/auth-ready gates
- [x] 7.2 Integrate `AppRoot` into Layout or router root
- [x] 7.3 Create `GroupAdminPanel` component with member management, ownership transfer, and join request handling
- [x] 7.4 Create `FilePickerModal` component with file type selection and upload flow
- [x] 7.5 Create `ConfirmModal` component (web counterpart to mobile's Alert.alert)

## 8. Integration & Cleanup

- [x] 8.1 Run `npx tsc --noEmit` across all workspaces (shared, web) — ZERO errors
- [ ] 8.2 Run `npm run build` and verify production build succeeds (**blocked**: pre-existing errors in ProfileScreen, ConnectionList, CourseList, GroupDetail, StudentProfile, hooks — outside scope of this change)
- [x] 8.3 Run `npm test` — 2/2 tests passing (web)
- [ ] 8.4 Manual smoke test: login flow, events list, group detail, message sending, file upload
