## 1. Navbar Parity

- [x] 1.1 Add lucide-react icons to `Layout.tsx` for Inicio (`Home`), Comunidad (`Users`), Vínculos (`GitBranch`), Notificaciones (`Bell`) alongside existing items
- [x] 1.2 Add `<Link>` elements for `/students` (Comunidad), `/connections` (Vínculos), `/notifications` (Notificaciones) in the navLinks section
- [x] 1.3 Change root `/` redirect from `/login` to `/events` in router.tsx (Inicio = events)
- [x] 1.4 Add notification badge to the Notificaciones link showing `notificationsStore.unreadCount`
- [x] 1.5 Add Navbar.module.css rules for new items and notification badge styling (`.badge` with `position: absolute`, gold background)
- [x] 1.6 Add `loadUnreadCount()` call in Layout on mount (import `notificationsService` and `notificationsStore`)

## 2. MessagesPage Real Data

- [x] 2.1 Create a `useConversations` hook in `features/messages/hooks/` that calls `messagesService.getMemberGroups()` or `messagesService.getRecentMessages()` to load conversation data
- [x] 2.2 Rewrite `MessagesPage.tsx` to use the new hook, replacing the hardcoded empty array with real data
- [x] 2.3 Add loading state (`<LoadingSpinner />`) and error state with retry button to MessagesPage
- [x] 2.4 Add empty state UI ("No hay conversaciones — únete a un grupo para empezar a chatear")
- [x] 2.5 Make each conversation item clickable, navigating to `/groups/{id}`

## 3. Auth-Init Guard

- [x] 3.1 Create `waitForAuth` utility in `src/features/auth/lib/waitForAuth.ts` using MobX `reaction()` with 5-second timeout fallback
- [x] 3.2 Integrate `waitForAuth` into `useEvents()` hook before `eventsStore.loadEvents()`
- [x] 3.3 Integrate `waitForAuth` into `useMyGroups()`, `useDiscoverGroups()`, `useGroupDetail()`, and `useGroupInvitations()` hooks before their first `refetch()`
- [x] 3.4 Add `waitForAuth` guard to `useConversations` hook (created in task 2.1)

## 4. Router / QueryClient Verification

- [x] 4.1 Verify `main.tsx` nesting: confirm `<QueryClientProvider>` wraps `<App>` which renders `<RouterProvider>` — current setup is correct, no code change needed
- [x] 4.2 Add a comment in `main.tsx` documenting the required nesting order (optional documentation-only change)

## 5. Verification

- [x] 5.1 Run `npm run typecheck:web` to confirm zero TypeScript errors
- [x] 5.2 Run `npm run test:web` to confirm no test regressions
- [x] 5.3 Manual smoke test: login flow, navbar navigation to all 7 routes, events page renders, groups page renders, messages page renders with data
