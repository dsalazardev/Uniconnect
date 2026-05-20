## Why

The Frontend Web application has significant navigation and data-rendering gaps compared to the Mobile app. Users see only 3 of 7 major navigation items, the Messages page shows no real data, and requests can fire before auth is initialized — causing silent failures and empty screens. This blocks the web app from being functionally useful.

## What Changes

- **Navbar parity**: Add missing navigation items (Inicio, Comunidad, Vínculos, Notificaciones) to web Layout to match Mobile's 7-item menu.
- **RouterProvider nesting**: Move `<RouterProvider>` inside `<QueryClientProvider>` in `main.tsx` so React Query hooks work correctly inside routes.
- **MessagesPage real data**: Replace hardcoded empty `Message[]` array with `useChat` or `MessagesService` call to load real messages from the API.
- **Auth-init guard**: Add `authStore.isInitialized` check in page-level hooks and stores so API calls don't fire before the auth token is hydrated from sessionStorage.
- **Layout condition**: Split Layout rendering so unauthenticated users see login; authenticated users see the full navbar + Outlet.

## Capabilities

### New Capabilities
- `web-navbar-parity`: Add Inicio, Comunidad, Vínculos, Notificaciones to the web navbar. Routes already exist — only the nav links are missing.
- `web-messages-real-data`: Connect MessagesPage to the MessagesService from `@uniconnect/shared` so it loads real conversations instead of an empty array.
- `web-auth-init-guard`: Guard API calls in pages/hooks until `authStore.isInitialized` is true, preventing premature requests that silently fail.
- `web-router-queryclient-fix`: Nest RouterProvider inside QueryClientProvider in main.tsx to satisfy React Query context requirements for all routes.

### Modified Capabilities
- *(none — no existing spec requirements are changing)*

## Impact

- **Files modified**: `Frontend/Frontend-web/src/main.tsx`, `src/components/Layout.tsx`, `src/pages/MessagesPage.tsx`, `src/features/messages/hooks/useChat.ts`, `src/features/events/hooks/useEvents.ts`, `src/features/groups/hooks/useMyGroups.ts` (auth-guard), and possibly store/hook files for auth-init guard.
- **No API changes**: All endpoints and data structures remain unchanged.
- **No Mobile changes**: Zero touch to Frontend-mobile or shared packages.
