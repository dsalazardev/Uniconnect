## ADDED Requirements

### Requirement: GroupsPage shows two tabs

The system SHALL display "Mis Grupos" and "Descubrir" as separate tabs on the GroupsPage at `/groups`.

#### Scenario: Default tab is "Mis Grupos"
- **WHEN** the user navigates to `/groups`
- **THEN** the "Mis Grupos" tab SHALL be active by default

#### Scenario: Tab switching renders correct content
- **WHEN** the user clicks "Descubrir"
- **THEN** the system SHALL render discoverable groups in place of "Mis Grupos" content

### Requirement: Discover tab shows join-request button

The system SHALL display a "Solicitar" button on each discoverable group card.

#### Scenario: Not yet requested — shows "Solicitar" button
- **WHEN** a discoverable group is rendered AND the user has not sent a join request
- **THEN** the system SHALL display a gold "Solicitar" button

#### Scenario: Request pending — shows disabled "Solicitud enviada"
- **WHEN** a discoverable group is rendered AND the user has sent a join request (tracked locally via `pendingRequests` Set OR via `item.user_request_status === 'join_requested'`)
- **THEN** the system SHALL display a disabled gray "Solicitud enviada" button

#### Scenario: Invited — shows "Invitación pendiente"
- **WHEN** a discoverable group is rendered AND `item.user_request_status === 'invited'`
- **THEN** the system SHALL display a blue-tinted disabled "Invitación pendiente" button

#### Scenario: Join request succeeds — optimistic update
- **WHEN** the user clicks "Solicitar" AND the API call succeeds
- **THEN** the button SHALL immediately update to "Solicitud enviada" and show a success toast

#### Scenario: Join request fails with "solicitud pendiente" — recover
- **WHEN** the API returns an error containing "solicitud pendiente"
- **THEN** the system SHALL still update the local `pendingRequests` Set to reflect the pending state

### Requirement: Discover tab shows owner name and course info

The system SHALL display owner name and course information on each discoverable group card.

#### Scenario: Group has course — shows course name
- **WHEN** a discoverable group has an associated `course`
- **THEN** the card SHALL display the course name in gold text

#### Scenario: Group has owner — shows owner name
- **WHEN** a discoverable group has an `owner`
- **THEN** the card SHALL display the owner's `full_name`

### Requirement: CreateGroupModal is wired into GroupsPage

The system SHALL provide a "Crear Grupo" button on the "Mis Grupos" tab that opens the CreateGroupModal.

#### Scenario: Create button opens modal
- **WHEN** the user clicks the "Crear Grupo" button on the "Mis Grupos" tab
- **THEN** the `CreateGroupModal` SHALL appear

#### Scenario: Modal submission creates group
- **WHEN** the user fills in the form and submits
- **THEN** the system SHALL call `createGroup` mutation and invalidate group queries on success
