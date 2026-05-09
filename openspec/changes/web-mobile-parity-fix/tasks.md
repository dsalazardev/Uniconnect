## 1. StudentProfile: Fix destructuring and add connection UI

- [x] 1.1 Fix `useStudentProfile` destructuring — change `{ profile, loading, error }` to `{ data: profile, isLoading, error }` in `StudentProfile.tsx`
- [x] 1.2 Import `useConnectionStatus` from `@/features/connections/hooks/useConnections` and `useConnections` hook in `StudentProfile.tsx`
- [x] 1.3 Add connection status section to `StudentProfile.tsx` — render "Conectar", "Aceptar/Rechazar", "Solicitud enviada", or "Amigos" based on `connectionStatus`
- [x] 1.4 Add "Enviar Mensaje" button that calls `openDirectMessage` from `useConnections` hook
- [x] 1.5 Wire toast feedback from existing mutation success/error handlers

## 2. GroupsPage: Tabs, discovery, and create modal

- [x] 2.1 Add `useState<'misGrupos' | 'descubrir'>` tab state and tab bar UI with CSS classes to `GroupsPage.tsx`
- [x] 2.2 Extract "Mis Grupos" render to `renderMisGruposTab()` — show `GroupCard` only for `myGroups`, keep edit/delete for owners
- [x] 2.3 Implement `renderDescubrirTab()` — render discoverable groups with inline card JSX showing name, course, description, owner
- [x] 2.4 Add `pendingRequests: Set<number>` state and "Solicitar" button per discover card with 3 states: normal / "Solicitud enviada" / "Invitación pendiente"
- [x] 2.5 Wire `handleRequestJoin` mutation using `useJoinRequest` from `@/features/groups/hooks/useJoinRequest`
- [x] 2.6 Import and instantiate `CreateGroupModal` in `GroupsPage.tsx`, wire "Crear Grupo" button on "Mis Grupos" tab
- [x] 2.7 Wire `EditGroupModal` if not already functional

## 3. ProfileScreen: Hook migration, editing, and courses

- [x] 3.1 Import and integrate `useProfile()` hook — fetch profile + courses data from API
- [x] 3.2 Replace `authStore.user` reads with `profile` from hook (fallback to `authStore.user` when loading)
- [x] 3.3 Add "Editar Perfil" button that opens an edit modal
- [x] 3.4 Build edit modal with phone input and "Sobre ti" textarea, pre-filled from profile
- [x] 3.5 Wire `updateProfile` mutation from `useProfile()` — on success toast + modal close, on error toast
- [x] 3.6 Add "Mis Cursos" section rendering `courses` array with name and state per course

## 4. EventFilters: Visual active-filter indicators

- [x] 4.1 Add CSS class `.filterActive` to `EventFilters.module.css` — highlighted border/background on the `<select>` when `filters.type` is set
- [x] 4.2 Add active filter pill showing selected type name below the dropdown when a filter is active
- [x] 4.3 Style the "Limpiar" button with a more visible color/hover when `hasActiveFilters` is true
- [x] 4.4 Ensure the info banner for date filters uses the same visual language (already exists but verify consistent styling)

## 5. Verify

- [x] 5.1 Run `npx tsc --noEmit` in `Frontend/Frontend-web/` — confirm zero TypeScript errors
- [x] 5.2 Run `npm test` (or `npx vitest run`) in `Frontend/Frontend-web/` — confirm existing tests pass
- [ ] 5.3 Manual smoke test: navigate through `/students/:id`, `/groups`, `/profile`, `/events` and confirm all 4 areas work
