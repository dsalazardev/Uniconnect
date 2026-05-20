## 1. Fix `ProgramList.tsx` — useQuery destructuring

- [x] 1.1 Change `const { programs, loading, error } = usePrograms();` to `const { data: programs, isLoading: loading, error } = usePrograms();`

## 2. Fix `StudentProfile.tsx` — mutation function types

- [x] 2.1 Type `mutationFn: (data) => ...` as `mutationFn: (data: { addressee_id: number }) => ...` in `sendRequestMutation`
- [x] 2.2 Type `mutationFn: (id) => ...` as `mutationFn: (id: number) => ...` in `acceptRequestMutation` and `rejectRequestMutation`

## 3. Fix `BibliotecaPage.tsx` — Resource type access

- [x] 3.1 Replace `r.url_externa` with `dec.url_externa` (where `dec = r.decoradores`) at lines 169-170

## 4. Fix `EventsPage.tsx` — unused import and callback type

- [x] 4.1 Remove unused `showToast` import from line 10
- [x] 4.2 Change `handleCreate` to accept `CreateEventFormPayload` and transform to `CreateEventPayload` inside the function body

## 5. Validate build

- [x] 5.1 Run `npm run build` — 5 targeted errors fixed ✅ (27 pre-existing errors remain in other files — see note below)

> **Note**: The build still fails due to ~27 pre-existing TypeScript errors in other files (`Layout.tsx`, `AuthStore.ts`, `ConnectionList.tsx`, `CourseList.tsx`, `ForumDashboard.tsx`, `EditGroupModal.tsx`, `GroupAdminPanel.tsx`, `ResourceLibrary.tsx`, `MessageBubble.tsx`, test files, etc.). These are outside the scope of this change. The 5 errors we targeted are all resolved.
