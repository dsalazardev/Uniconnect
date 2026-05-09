## Context

The Frontend Web app (`Frontend-web/`) was scaffolded with routing, stores, and services connected to `@uniconnect/shared`, but has UX and data-rendering gaps vs Mobile:

- The `Layout` navbar shows only 3/7 navigation items from Mobile
- `MessagesPage` hardcodes `messages: Message[] = []` — no API call at all
- Auth hydration (`sessionStorage`) is synchronous and completes in the `AuthStore` constructor; but pages that mount concurrently with auth initialization may fire API requests before the interceptor's `isInitialized()` guard has resolved (edge case in StrictMode or slow storage)

The **shared API client** (`shared/src/api/client.ts`) already has a request interceptor that checks `authProvider.isInitialized()` and rejects early requests. The gap is that stores/hooks don't retry — they catch the rejection and set empty data silently.

## Goals / Non-Goals

**Goals:**
1. Add missing navbar items (Inicio, Comunidad, Vínculos, Notificaciones) matching Mobile layout
2. Connect MessagesPage to real data via `MessagesService.getRecentMessages()`
3. Add `authStore.isInitialized` guard in page-level hooks so API calls wait or retry
4. Verify main.tsx routing nesting (QueryClientProvider > RouterProvider) is correct — current setup is correct, document it

**Non-Goals:**
- No changes to Mobile, shared package, or backend
- No new MobX stores (use existing React Query + hooks pattern where already established)
- No CSS overhaul — only add minimal styling for new navbar items
- No WebSocket chat implementation for MessagesPage (phase 2 concern)

## Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| D1 | Add navbar links as plain `<Link>` with lucide-react icons | Matches Mobile's icon+label pattern; lucide-react already a dependency | Plain text links (less visual parity), or react-icons (extra dep) |
| D2 | MessagesPage uses `messagesService.getRecentMessages()` directly (not `useChat`) | `useChat` requires a groupId — MessagesPage should show a conversation list/selector first | Full `useChat` integration (premature — needs group selection UI) |
| D3 | Auth-init guard: add `waitForAuth` utility + guard in hooks | Reusable pattern; hooks await store initialization before firing API calls | Polling `isInitialized` in each component (repetitive), or relying solely on the Axios interceptor (silent failures) |
| D4 | RouterProvider stays inside QueryClientProvider as currently implemented | Verify: `main.tsx` already nests `<QueryClientProvider><App /></QueryClientProvider>` and `App` renders `<RouterProvider>` — this is correct. No change needed. | Moving RouterProvider outside (would break React Query in routes) |
| D5 | Inicio route points to `/events` (same as Mobile's default tab) | Mobile's "Inicio" redirects to events feed; web should match | Create a separate dashboard (no parity requirement, extra work) |

### Auth-Init Guard Implementation

The shared Axios client already blocks requests when `!authProvider.isInitialized()`. The gap is that stores catch the rejection silently. Fix: add a utility that hooks call before the first API request:

```typescript
// shared pattern already in use by web's constants/api.ts — just need hook-level guard
async function waitForAuth(authStore: AuthStore): Promise<void> {
  if (authStore.isInitialized) return;
  return new Promise((resolve) => {
    const disposer = reaction(
      () => authStore.isInitialized,
      (initialized) => { if (initialized) { disposer(); resolve(); } }
    );
  });
}
```

Hooks like `useEvents`, `useMyGroups`, `useDiscoverGroups` call `await waitForAuth(authStore)` before their first `loadEvents()` / `refetch()`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Adding auth-guard retry logic could mask real auth failures | Only guard on `!isInitialized` (hydration timing), not on `!isAuthenticated`. Genuine failures still propagate. |
| MessagesPage without WebSocket: no real-time updates | Acceptable for parity phase — shows messages loaded via REST. Real-time WebSocket is a separate capability. |
| Adding 4 navbar items makes the bar crowded on narrow screens | CSS `flex-wrap` + scroll or responsive collapse. Mobile's pattern uses a hamburger menu — web can adopt later if needed. |
