## ADDED Requirements

### Requirement: GroupDetail renders from raw backend response

The GroupDetail component SHALL fetch group details using the `useGroupInfo` React Query hook instead of manual `useEffect`+`useState`. The component MUST handle the raw `GroupInfo` object returned by the backend (not wrapped in `{success, data, error}`).

#### Scenario: GroupDetail loads successfully
- **WHEN** the user navigates to `/groups/:id`
- **THEN** the component calls `useGroupInfo(groupId)` and renders the group name, description, course, and member list from the raw response object

#### Scenario: GroupDetail shows loading state
- **WHEN** the query is loading
- **THEN** the component shows a spinner and "Cargando grupo..." text

#### Scenario: GroupDetail handles error
- **WHEN** the query returns an error or the group is not found
- **THEN** the component shows an error message and a "Volver" button

#### Scenario: GroupDetail handles raw backend response
- **WHEN** `getGroupInfo()` returns a `GroupInfo` object directly (no `{success, data, error}` wrapper)
- **THEN** the component extracts `name`, `description`, `course`, `memberships`, `owner_id`, and `canManageMembers` directly from the response object

### Requirement: GroupDetail uses React Query hook

The component SHALL use `useGroupInfo(groupId)` from `@/features/groups/hooks/useGroupInfo` instead of calling `groupsService.getGroupInfo()` manually inside `useEffect`. The hook provides built-in refetch behavior and stale data management.

#### Scenario: GroupDetail replaces manual state management
- **WHEN** the component renders
- **THEN** it MUST NOT contain `useState` for group data or `useEffect` for data fetching
- **THEN** it MUST destructure `{ data, isLoading, error }` from `useGroupInfo(groupId)`
