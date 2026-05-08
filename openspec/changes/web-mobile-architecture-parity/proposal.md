## Why

A structural audit (G1–G18) revealed 18 gaps between the Mobile (React Native) and Web (React+Vite) frontends. Six are critical blockers: refresh token stub, missing PKCE code_verifier, undeclared React Query, broken imports in groups and messages hooks, and no `useEvents` hook. Partial ad-hoc fixes were applied before this spec was created; the remainder must be formalized to achieve total architecture and design parity.

## What Changes

### Already Implemented (ad-hoc, needs ratification)
- **G1**: `refreshTokens()` in `web/src/constants/api.ts` now calls `AuthService.refreshTokens()` instead of throwing.
- **G2**: `useWebAuth.ts` generates a PKCE `code_verifier` via Web Crypto API and stores it in `sessionStorage`.
- **G2-b**: Logout now calls `POST /auth/logout` before clearing local state.
- **G3**: `@tanstack/react-query` and `socket.io-client` added to `web/package.json`.
- **G4**: Groups feature now has `types/index.ts` barrel re-exporting from `@uniconnect/shared`.
- **G5**: Messages feature now has `types/index.ts` and `config/websocket.config.ts`. A web-only stub for `services/files.service.ts` was created temporarily — this must be superseded by a shared `FilesService` (see Pending).
- **G6**: `useEvents` hook created with `EventsPage` wrapper for route integration.

### Pending Implementation
- **Shared FilesService**: Extract `validateFiles()`, `getFileSize()`, `getPresignedDownloadUrl()` from mobile's `FilesService` into `@uniconnect/shared/src/services/files.service.ts`. Create `FILES_ENDPOINTS` in shared. Refactor mobile to consume shared. Wire web to consume shared. Platform-specific methods (`uploadFiles`, `downloadAndOpenFile`) remain per-platform.
- **Shared NotificationObserver**: Move `NotificationObserverService` from mobile's `notification-observer.service.ts` into `@uniconnect/shared/src/services/notification-observer.service.ts`. Refactor mobile to import from shared. Wire web to import from shared.
- **UI Design System**: Build reusable `Button`, `Modal`, `Input` primitives for web (matching mobile's `components/elements/`).
- **Toast System**: Replace `console.log` stub in `web/src/lib/toast.ts` with a real toast library (e.g., `react-hot-toast` or `sonner`).
- **Icon Library**: Replace emoji icons with `lucide-react` (the web counterpart to `expo-vector-icons`).
- **Component Parity**: Build missing components: `GroupAdminPanel`, `FilePickerModal`, `ConfirmModal`.
- **AppRoot Gate**: Add `AppRoot` component for auth initialization loading/error gate.

## Capabilities

### New Capabilities
- `auth-parity`: Auth flow alignment — refresh token, PKCE, logout with backend, token persistence format.
- `dependency-parity`: Declare all runtime dependencies currently resolved via hoisting.
- `imports-parity`: Fix all broken module imports in groups and messages features.
- `events-store-hook`: Connect events store to UI via `useEvents` hook.
- `ui-design-system`: Reusable web primitives (Button, Modal, Input) matching mobile's `elements/` barrel.
- `toast-system`: Visual feedback for success/error/info operations.
- `icon-library`: Replace emoji placeholders with `lucide-react` icons.
- `component-parity`: Build missing feature components (GroupAdminPanel, FilePickerModal, ConfirmModal, AppRoot).

### Modified Capabilities
*(None — no existing spec requirements are changing)*

## Impact

- **Frontend-web**: ~30 files modified or created across `src/features/auth/`, `src/features/events/`, `src/features/groups/`, `src/features/messages/`, `src/constants/`, `src/lib/`, `src/components/`.
- **Frontend-web package.json**: Adds `@tanstack/react-query`, `socket.io-client`, `lucide-react`, `react-hot-toast`.
- **Shared package**: Two new services created: `FilesService` (with `validateFiles`, `getFileSize`, `getPresignedDownloadUrl`) and `NotificationObserverService`. New endpoints file `files.ts`. No type changes needed.
- **Mobile**: Refactored to import `FilesService` and `NotificationObserverService` from `@uniconnect/shared` instead of local files.
- **Backend**: No changes required.
