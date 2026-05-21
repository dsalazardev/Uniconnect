## ADDED Requirements

### Requirement: Member list shows a direct message button per member
The system SHALL display a DM (direct message) button for each member in the member list, allowing the current user to start a private chat.

#### Scenario: Start DM from member list
- **WHEN** the user views the member list of a group
- **THEN** each member row (except the current user) shows a MessageCircle button
- **WHEN** the user clicks the DM button
- **THEN** the system calls `groupsService.findOrCreateDirectMessage(targetUserId)`
- **THEN** the user is navigated to `/chat/${groupId}`

### Requirement: Confirm dialogs before destructive actions
The system SHALL show confirmation dialogs before: sending a join request, making a member admin, and rejecting a join request.

#### Scenario: Confirm before sending join request
- **WHEN** a non-member clicks "Solicitar" to join a group in the Discover tab
- **THEN** a `ConfirmModal` appears with "¿Enviar solicitud de acceso al grupo?"
- **WHEN** the user confirms
- **THEN** the join request is sent
- **WHEN** the user cancels
- **THEN** no action is taken

#### Scenario: Confirm before rejecting join request
- **WHEN** an owner clicks "Rechazar" on a pending join request in GroupAdminPanel
- **THEN** a `ConfirmModal` appears with "¿Rechazar esta solicitud de acceso?"
- **WHEN** the owner confirms
- **THEN** the request is rejected

#### Scenario: Confirm before making member admin
- **WHEN** an owner clicks "Make Admin" on a member
- **THEN** a `ConfirmModal` appears confirming the action
- **WHEN** the owner confirms
- **THEN** the member is promoted to admin
