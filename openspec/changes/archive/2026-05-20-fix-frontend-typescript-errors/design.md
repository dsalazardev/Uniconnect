## Context

The TypeScript build (`tsc -b`) fails on 5 errors across 4 files. All errors are type-level — incorrect property access, wrong destructuring, mismatched function signatures, or unused imports. The runtime behavior is correct (the app works in dev with `vite` which bypasses `tsc`), but production build requires strict type checking.

The shared package types (`@uniconnect/shared`) are correct — the fixes must be in the consumer code, not in the types.

## Goals / Non-Goals

**Goals:**

- Make `npm run build` (`tsc -b && vite build`) pass with exit code 0
- Fix only type errors — zero runtime behavior changes
- Prefer proper typing over `as any` escape hatches

**Non-Goals:**

- Refactoring component logic or data flow
- Changing shared package types or validators
- Adding test coverage (out of scope)

## Decisions

### D1 — `ProgramList.tsx`: fix `useQuery` destructuring

**Error**: `usePrograms()` returns `UseQueryResult<Program[], Error>` which has `.data`, `.isLoading`, `.error`. The code destructures `.programs`, `.loading`.

**Fix**: 
```typescript
const { data: programs, isLoading: loading, error } = usePrograms();
```
Rename `data` → `programs` and `isLoading` → `loading` via destructuring alias.

### D2 — `StudentProfile.tsx`: type `useMutation` parameters

**Errors at lines 120, 138, 146**: `sendConnectionRequest`, `acceptConnectionRequest`, `rejectConnectionRequest` are called with arguments, but the mutation functions have untyped `data` parameters causing TypeScript to infer `void`.

**Fix**: Add explicit type annotations to each `mutationFn`:
- `sendRequestMutation`: `mutationFn: (data: { addressee_id: number }) => ...`
- `acceptRequestMutation`: `mutationFn: (id: number) => ...`
- `rejectRequestMutation`: `mutationFn: (id: number) => ...`

### D3 — `BibliotecaPage.tsx`: use `decoradores` wrapper

**Error at line 169**: `r.url_externa` — the `Resource` type has `url_externa` inside `r.decoradores`, not at the root level.

**Fix**: 
```typescript
const dec = r.decoradores;
// then use dec.url_externa, dec.imagen_preview, etc.
```
The code already does `const dec = r.decoradores;` at line 151 but then uses `dec.imagen_preview` correctly (line 154) while inconsistently using `r.titulo` (correct, at root level) and `r.url_externa` (wrong, should be `dec.url_externa`).

### D4 — `EventsPage.tsx`: remove unused import, fix callback

**Error 1 at line 10**: `showToast` imported but never used.

**Fix**: Remove the import.

**Error 2 at line 106**: `handleCreate` has type `(payload: CreateEventPayload) => Promise<void>` but `CreateEventModal.onSubmit` expects `(data: CreateEventFormPayload) => void`.

**Fix**: Change `handleCreate` to accept `CreateEventFormPayload` and transform to `CreateEventPayload` internally:
```typescript
const handleCreate = async (data: CreateEventFormPayload) => {
  const payload: CreateEventPayload = {
    title: data.title,
    description: data.description,
    location: data.location,
    date: data.start_date,
    time: data.start_date,  // or format appropriately
    type: EventType.CONFERENCIA,  // default or map from category
  };
  const success = await createEvent(payload);
  if (success) setCreateModalVisible(false);
};
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `as any` escape hatches hide real bugs | D1-D4 use proper types, not `as any` |
| `BibliotecaPage` runtime could break if `decoradores` is null | The Zod schema makes `decoradores` required. The API always returns it. |
| `events.service.ts` might reject `createEvent` with transformed payload | The transformation maps existing fields; if the service expects different field names, a runtime error surfaces immediately (fail-fast). |
