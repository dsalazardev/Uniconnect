## Context

The web frontend (`Frontend/Frontend-web/`) has 4 distinct parity gaps vs mobile (`Frontend-mobile/`), confirmed via codebase exploration:

| Area | Web Bug | Mobile Has |
|------|---------|------------|
| StudentProfile | Wrong `useQuery` destructuring (`loading` vs `isLoading`, `profile` vs `data`) causing flash-of-error on every navigation; no connection buttons | Correct destructuring + full `useConnectionStatus` UI |
| GroupsPage | myGroups + discoverGroups merged into one flat list; no join button; CreateGroupModal not wired | Two tabs ("Mis Grupos" / "Descubrir") with join-request flow |
| ProfileScreen | Read-only via `authStore.user`; no edit capability | Full edit with phone, courses, image picker |
| EventFilters | No visual indicator when a filter is active | Same logic but clearer visual state via `hasActiveFilters` |

Key finding: The web frontend already has `useConnectionStatus` hook at `features/connections/hooks/useConnections.ts:116` — identical to mobile's. It just needs to be wired into `StudentProfile.tsx`.

## Goals / Non-Goals

**Goals:**
- Fix `StudentProfile.tsx` destructuring bug — stop "Perfil no encontrado" flash
- Add connection buttons (send request / accept+reject / status) to `StudentProfile.tsx` using existing `useConnectionStatus` hook
- Add "Enviar Mensaje" button using existing `openDirectMessage` from `useConnections`
- Split `GroupsPage.tsx` into "Mis Grupos" / "Descubrir" tabs with join-request state tracking
- Wire `CreateGroupModal` into `GroupsPage.tsx`
- Refactor `ProfileScreen.tsx` to use `useProfile()` hook with edit mode for phone and bio
- Add courses display to `ProfileScreen.tsx` using existing `useProfile().courses`
- Add visual active-filter indicators to `EventFilters.tsx` (highlighted type, per-filter clear, color change)

**Non-Goals:**
- No changes to mobile (`Frontend-mobile/`)
- No backend changes
- No new npm packages (all dependencies exist in `@uniconnect/shared` or existing hooks)
- No image picker on web (not needed for desktop parity; out of scope)
- No full course CRUD on web ProfileScreen (display only; mutations are desktop-future)
- No `/profile/:id` route creation (the correct route is `/students/:id`)

## Decisions

### 1. Connection buttons: use existing `useConnectionStatus` hook
- **Option considered**: Inline API calls vs existing hook
- **Decision**: Import `useConnectionStatus` from `@/features/connections/hooks/useConnections` — it already exists with optimistic updates, toast feedback, and cache invalidation. Matches mobile pattern exactly.
- **Rationale**: Zero new infrastructure. 1-line import.

### 2. GroupsPage tabs: CSS-based tab component (no sub-routes)
- **Option considered**: React Router sub-routes (`/groups/mis-grupos`, `/groups/descubrir`) vs CSS state tabs
- **Decision**: Local `useState<'misGrupos' | 'descubrir'>` with CSS tab bar, matching mobile pattern
- **Rationale**: Simpler, matches mobile UX exactly, no URL duplication, no route config changes

### 3. Discover group cards: separate render vs unified GroupCard
- **Option considered**: Modify `GroupCard` to handle both cases vs inline render
- **Decision**: Inline discover card JSX in `GroupsPage.tsx` (like mobile does in `renderDescubrirTab()`). No separate component needed unless it gets complex.
- **Rationale**: Mobile uses inline render too. Keeps changes minimal.

### 4. Join request state tracking: local Set + server status
- **Option considered**: Only server-side status vs optimistic local state
- **Decision**: Both — `pendingRequests: Set<number>` for optimistic UI + `item.user_request_status` from backend for persisted state. Matches mobile exactly.
- **Rationale**: Mobile pattern proven in production.

### 5. ProfileScreen editing: modal pattern
- **Option considered**: Inline editing (contentEditable / direct input fields) vs modal
- **Decision**: Modal-based editing with a button "Editar Perfil" → EditProfileModal
- **Rationale**: Matches mobile mental model, cleaner separation, works well on desktop

### 6. Active filter visual: CSS class toggle
- **Option considered**: React state-based conditional rendering vs CSS classes
- **Decision**: CSS class toggle when `hasActiveFilters` is true — change `<select>` border color, add active pill for type filter, bold "Limpiar" button
- **Rationale**: Zero state changes needed, purely visual layer

## Decisions Map

```
Decision Tree: StudentProfile
┌─────────────────────────────────────────────┐
│  useStudentProfile(Number(id))              │
│  └─ BUG: destructuring wrong                │
│  └─ FIX: { data: profile, isLoading, error } │
│                                              │
│  useConnectionStatus(Number(id))             │
│  └─ Returns: { connectionStatus,             │
│       sendConnectionRequest,                 │
│       acceptConnectionRequest,               │
│       rejectConnectionRequest }              │
│                                              │
│  openDirectMessage(userId)                   │
│  └─ From useConnections hook                 │
└─────────────────────────────────────────────┘

Decision Tree: GroupsPage
┌─────────────────────────────────────────────┐
│  activeTab: 'misGrupos' | 'descubrir'       │
│                                              │
│  Tab Bar ──┬─ "Mis Grupos" ──→ render my    │
│             │                   GroupCards   │
│             ├─ "Descubrir" ──→ render        │
│             │                   discoverCards │
│             │                   with "Soli-   │
│             │                   citar" btn    │
│             │                                  │
│  CreateGroupModal ─── solo en "Mis Grupos"   │
│  pendingRequests: Set<number>                │
│  user_request_status from backend             │
└─────────────────────────────────────────────┘
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `useConnectionStatus` imports for each student profile could cause many API calls | Query key `['connection-status', userId]` is cached 1 min; visits to different profiles are independent |
| `openDirectMessage` navigates to group chat but React Router integration is marked "TODO" | Use `navigate()` from react-router-dom; group detail route exists at `/groups/:id` |
| Edit modal for profile might feel complex vs inline edit | Start minimal: phone + bio only. Course edits can be added later. |
| Discover tab join button disabled state might be confusing if backend is slow | Optimistic update using local `Set<number>` + `useMutation.onMutate` |


## Open Questions

- None resolved. All decisions are based on existing code patterns.
