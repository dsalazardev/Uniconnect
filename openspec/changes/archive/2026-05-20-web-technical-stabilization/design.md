## Context

The web frontend has several bugs introduced during the mobile-to-web parity implementation (May 2026). The backend Groups module returns raw objects (no FEN wrapper) but `GroupDetail.tsx` assumes a `{success, data, error}` structure. `useProfile.ts` fetches all courses instead of only enrolled ones. `openDirectMessage` never calls `navigate()`. EventsPage and EventFilters lack MobX `observer()` wrapping, so store mutations don't trigger re-renders. Several components use manual `useEffect`+`useState` where React Query hooks already exist.

All fixes are scoped to `Frontend/Frontend-web/` — no backend changes needed.

## Goals / Non-Goals

**Goals:**
- GroupDetail renders correctly from raw backend response (no crash on `.success`)
- Profile shows only the user's enrolled courses (not all system courses)
- "Enviar Mensaje" button navigates to `/groups/:id`
- Event filter/sort changes reflect immediately in the UI
- Remove unnecessary `useEffect` patterns, replacing with React Query where applicable

**Non-Goals:**
- No backend changes (all fixes are frontend interpretation of existing responses)
- No new UI components or features (only fixing existing ones)
- No mobile changes (Frontend-mobile untouched)
- No changes to event filtering logic or API (only reactivity fix)
- No EditGroupModal creation (still logs to console)

## Decisions

### D1: Direct object assignment in GroupDetail (no adapter)

Replace the `response.success/data/error` check with direct assignment of `response` (which is already a `GroupInfo` object). `groupsService.getGroupInfo()` returns `response.data` from Axios, which is the raw backend object. No adapter layer needed — just use the hook's returned data directly.

**Why not an adapter?** Only one consumer (GroupDetail) has this mismatch. An adapter adds complexity for no reuse benefit.

### D2: coursesService.getByStudent() for profile courses

Switch from `studentsService.getCourses()` (hitting `GET /courses`) to `coursesService.getByStudent()` (hitting `GET /courses/get-by-student`). The `CoursesService` is already instantiated in `@/features/courses/services`. This returns only the authenticated user's enrolled courses.

**Why not use profile?.courses?** The profile endpoint may return a different shape. Using the dedicated enrolled-courses endpoint is more reliable and follows the principle of single responsibility.

### D3: navigate callback for openDirectMessage

Pass `navigate` as a second parameter to `openDirectMessage(targetUserId, navigate)`. The calling component (`StudentProfile`) already has access to `useNavigate()`. This avoids breaking the hook's platform-agnostic contract (no direct React Router dependency).

**Alternative considered:** Import `useNavigate` inside the hook — rejected because hooks must be called inside React components, and `useConnections` is a custom hook that may be reused in different router contexts.

### D4: observer() on EventsPage (not EventFilters)

Wrap only `EventsPage` in `observer()`. EventFilters receives filters via props and is a pure presentational component. Since `EventsPage` calls `useEvents()` which reads from `eventsStore`, wrapping EventsPage makes the entire tree reactive.

**Why not wrap EventFilters too?** Unnecessary — EventFilters is already controlled by its parent via props. Observer on EventsPage makes the prop updates flow correctly.

### D5: Remove useEffect for phone in ProfileScreen

Instead of `useEffect` syncing the `phone` state variable whenever `profile` changes, compute the initial value directly in `handleOpenEdit`. This removes the extra render cycle and the risk of stale state.

## Risks / Trade-offs

- **[Navigation timing]** The `navigate()` call in `openDirectMessage` fires after an async API call. If the API takes long, the user sees no immediate feedback. → Mitigation: Add a loading toast or disable the button during the call.
- **[MobX observer overhead]** Wrapping EventsPage in `observer()` adds MobX tracking. On large pages with many observables, this can cause excessive re-renders. → Mitigation: `useEvents()` already reads a limited set of observables (events, filters, loading, error) — minimal tracking surface.
- **[getByStudent() availability]** If the backend `GET /courses/get-by-student` endpoint isn't implemented, the call fails silently. → Mitigation: The endpoint exists in shared types, verify it works before deploying.
