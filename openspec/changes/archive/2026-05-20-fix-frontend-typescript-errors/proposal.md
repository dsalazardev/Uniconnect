## Why

The Frontend-web has pre-existing TypeScript errors in 4 files (ProgramList, StudentProfile, BibliotecaPage, EventsPage) that block `tsc -b` — the compilation step before `vite build`. Since the Amplify build pipeline runs `npm run build` (`tsc -b && vite build`), these errors prevent any deployment to Amplify. Fixing them is a prerequisite for the Amplify deploy pipeline.

## What Changes

- **`ProgramList.tsx`**: Fix destructuring of `useQuery` return value — use `data`/`isLoading` instead of `programs`/`loading`
- **`StudentProfile.tsx`**: Fix `useMutation` call signatures — type the mutation function parameters so the returned `mutate` functions accept arguments
- **`BibliotecaPage.tsx`**: Fix `Resource` type access — use `r.decoradores.url_externa` instead of `r.url_externa`
- **`EventsPage.tsx`**: Remove unused `showToast` import; fix `handleCreate` type to match `CreateEventModal.onSubmit` signature

## Capabilities

### New Capabilities
- *(None — this is a bugfix change, no new capabilities)*

### Modified Capabilities
- *(None — no spec-level behavior changes; only type-level fixes)*

## Impact

- **4 files modified**, type changes only — no runtime behavior change
- **Build pipeline**: `tsc -b` will pass, allowing Amplify deployment
- **Shared types** (`@uniconnect/shared`): No changes — the types are correct, the consumers were wrong
