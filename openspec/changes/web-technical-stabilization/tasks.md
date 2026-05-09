## 1. Refactor GroupDetail to use React Query hook

- [x] 1.1 Replace `useState` + `useEffect` with `useGroupInfo(groupId)` hook in GroupDetail.tsx
- [x] 1.2 Update response handling to destructure `{ data, isLoading, error }` directly (no `.success`/`.data` access)
- [x] 1.3 Update render logic to use `data` (raw GroupInfo object) instead of `groupInfo` state variable
- [x] 1.4 Remove unused `groupsService` import (no longer called directly)
- [x] 1.5 Run `npx tsc --noEmit` and verify zero errors

## 2. Fix profile courses endpoint

- [x] 2.1 Import `coursesService` from `@/features/courses/services` in `useProfile.ts`
- [x] 2.2 Replace `studentsService.getCourses()` with `coursesService.getByStudent()` in `useProfile.ts`
- [x] 2.3 Remove `useEffect` for phone/bio sync in `ProfileScreen.tsx` and use derived state in `handleOpenEdit`
- [x] 2.4 Run `npx tsc --noEmit` and verify zero errors

## 3. Wire up message navigation

- [x] 3.1 Add `navigate` parameter to `openDirectMessage` function in `useConnections.ts`
- [x] 3.2 Replace `console.log('Navigate to group:', ...)` with `navigate('/groups/' + response.group.id_group)`
- [x] 3.3 Update `StudentProfile.tsx` to pass `navigate` from `useNavigate()` to `openDirectMessage`
- [x] 3.4 Run `npx tsc --noEmit` and verify zero errors

## 4. Activate MobX reactivity for event filters

- [x] 4.1 Import `observer` from `mobx-react-lite` in `EventsPage.tsx`
- [x] 4.2 Wrap `EventsPage` export with `observer()`
- [x] 4.3 Remove unused `observer` import from `useEvents.ts` (line 2 — imported but never used)
- [x] 4.4 Run `npx tsc --noEmit` and verify zero errors

## 5. Verify and test

- [ ] 5.1 Run `npx vitest run` and confirm all tests pass
- [ ] 5.2 Manual smoke test: navigate `/groups/:id` and verify GroupDetail renders correctly
- [ ] 5.3 Manual smoke test: verify profile shows only enrolled courses
- [ ] 5.4 Manual smoke test: verify "Enviar Mensaje" navigates to DM group
- [ ] 5.5 Manual smoke test: verify event filters update UI immediately
