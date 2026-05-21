## Why

The web frontend lags behind mobile in 4 functional areas: profile editing, community interactions, group management, and event filter UX. Users on web can't edit profiles, connect with peers, join discoverable groups, or get clear filter feedback — all of which work on mobile. This parity gap creates a degraded experience for web users.

## What Changes

1. **Fix StudentProfile page**: Correct `useQuery` destructuring bug (`loading`/`profile` → `isLoading`/`data`). Add connection buttons (send request, accept, reject, status display) and "Send Message" button using `ConnectionsService` from `@uniconnect/shared`.
2. **Restructure GroupsPage into tabs**: Split "Mis Grupos" and "Descubrir" into tabbed views. Add "Solicitar unirse" button on discover groups with request state tracking. Wire `CreateGroupModal` into the page.
3. **Refactor ProfileScreen**: Switch from raw `authStore.user` to `useProfile()` hook. Add edit capability for phone and "Sobre ti" section. Display student courses list.
4. **Improve EventFilters visual feedback**: Add active filter indicators (highlighted type, clear icon for each filter, visual state differentiation) so users can see when filters are applied.

## Capabilities

### New Capabilities
- `student-profile-connections`: Connection request/accept/reject UI on student profile pages in web
- `groups-tab-discovery`: Tab-separated group browsing with join-request flow for web
- `profile-self-edit`: Inline/modal editing of own profile (phone, bio) and course display on web

### Modified Capabilities
- *(none — no existing specs change behavior, only new capabilities)*

## Impact

- **Files modified** (`Frontend/Frontend-web/src/`):
  - `features/students/components/StudentProfile.tsx` — destructuring fix + connection buttons
  - `pages/GroupsPage.tsx` — tabs, join flow, create modal wiring
  - `features/auth/components/ProfileScreen.tsx` — useProfile hook + edit UI
  - `features/events/components/EventFilters.tsx` — active filter indicators
  - `features/events/components/EventFilters.module.css` — visual styles for active filters
- **Files potentially new**:
  - Feature-specific connection hooks or inline connection logic in `StudentProfile.tsx`
  - Discover card component or inline render in `GroupsPage.tsx`
- **Dependencies used from `@uniconnect/shared`**:
  - `ConnectionsService` — connection request/accept/reject
  - `StudentsService` — profile fetch + update
  - `GroupsService` — create group, request join
- **No mobile files touched**
