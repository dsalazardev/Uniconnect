## Why

The web frontend has accumulated technical debt: broken API response handling, non-reactive MobX components, missing navigation, wrong API endpoints, and unnecessary `useEffect` patterns. These cause runtime errors (GroupDetail crashes), stale UI (filters don't respond), wrong data (all courses instead of enrolled), and dead navigation buttons. Fixing these restores parity with mobile and unblocks further development.

## What Changes

- **GroupDetail.tsx**: Replace manual `useEffect` + `useState` with React Query `useGroupInfo` hook. Fix response validation to handle raw backend objects (no `.success`/`.data` wrapper).
- **useProfile.ts**: Change `coursesService.getAll()` to `coursesService.getByStudent()` so profile shows only the user's enrolled courses.
- **ProfileScreen.tsx**: Remove unnecessary `useEffect` for phone sync; use derived state.
- **useConnections.ts**: Implement `navigate()` in `openDirectMessage` (accept `navigate` as parameter), redirecting to `/groups/:id` after creating/finding a DM.
- **EventsPage.tsx** and **EventFilters.tsx**: Wrap in MobX `observer()` HOC so filter changes trigger re-renders.

## Capabilities

### New Capabilities
- `group-detail-refactor`: Refactor GroupDetail component to use React Query hook with proper backend response handling
- `profile-courses-fix`: Fix profile to display only the user's enrolled courses instead of all system courses
- `message-navigation`: Wire up React Router navigation for direct message creation flow
- `mobx-reactivity`: Make event filter/sort UI reactive by wrapping components in MobX observer()

### Modified Capabilities

None — all changes are new implementations or internal refactors, not requirement changes to existing specs.

## Impact

- **Components modified**: GroupDetail.tsx, ProfileScreen.tsx, EventsPage.tsx, EventFilters.tsx
- **Hooks modified**: useProfile.ts, useConnections.ts
- **No new dependencies**: All tools already available (React Query, MobX, React Router)
- **No API changes**: Backend untouched — all fixes are frontend-side interpretation of responses
