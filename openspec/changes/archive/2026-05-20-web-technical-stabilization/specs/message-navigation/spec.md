## ADDED Requirements

### Requirement: Enviar Mensaje navigates to direct message chat

The "Enviar Mensaje" button on a student's profile SHALL navigate the user to the direct message group after creating or finding it. The `openDirectMessage` function in `useConnections` SHALL accept an optional `navigate` callback parameter and call `navigate('/groups/' + groupId)` after a successful API response.

#### Scenario: Enviar Mensaje creates DM and navigates
- **WHEN** the user clicks "Enviar Mensaje" on a connected student's profile
- **THEN** `groupsService.findOrCreateDirectMessage(targetUserId)` is called
- **THEN** on success, the user is redirected to `/groups/:id` where `:id` is the DM group's id_group
- **THEN** a success toast is shown if the DM was newly created

#### Scenario: Enviar Mensaje handles API error
- **WHEN** the API call fails
- **THEN** the user stays on the profile page
- **THEN** an error toast is shown with the error message
- **THEN** navigation does not occur

### Requirement: navigate is passed from calling component

The `openDirectMessage` function SHALL accept `navigate` from React Router's `useNavigate()` hook, passed from the calling component (`StudentProfile`). The hook itself SHALL NOT call `useNavigate()` directly.

#### Scenario: StudentProfile passes navigate to hook
- **WHEN** `StudentProfile` renders the "Enviar Mensaje" button
- **THEN** the `onClick` handler calls `openDirectMessage(targetUserId, navigate)` where `navigate` comes from `useNavigate()`
