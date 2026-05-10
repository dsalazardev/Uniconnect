## ADDED Requirements

### Requirement: Owner can promote a member to admin
The system SHALL allow the group owner to promote any non-owner, non-admin member to admin status.

#### Scenario: Successful promotion
- **WHEN** the group owner clicks "Make Admin" on a member in the admin panel
- **WHEN** the owner confirms the action in the confirmation dialog
- **THEN** the system calls `groupsService.makeMemberAdmin(groupId, memberId)`
- **THEN** the member's role updates to admin in the UI
- **THEN** a success toast appears

#### Scenario: Confirmation dialog before promotion
- **WHEN** the group owner clicks "Make Admin" on a member
- **THEN** a `ConfirmModal` appears with the message "Convertir a [name] en administrador?"
- **WHEN** the owner clicks "Cancelar"
- **THEN** no changes are made

#### Scenario: Only owner sees the button
- **WHEN** a non-owner admin views the admin panel
- **THEN** no "Make Admin" button is visible

### Requirement: Candidate can accept or decline ownership transfer
The system SHALL allow a user who has been nominated as the new group owner to accept or decline the transfer.

#### Scenario: Accept ownership transfer
- **WHEN** a user opens a group where they are the `pending_owner_id`
- **THEN** a `TransferInvitationBanner` appears with "Aceptar" and "Rechazar" buttons
- **WHEN** the user clicks "Aceptar"
- **WHEN** the user confirms in the confirmation dialog
- **THEN** the system calls `groupsService.acceptOwnershipTransfer(groupId)`
- **THEN** the user becomes the new owner of the group

#### Scenario: Decline ownership transfer
- **WHEN** the candidate clicks "Rechazar" on the `TransferInvitationBanner`
- **WHEN** the user confirms
- **THEN** the system calls `groupsService.declineOwnershipTransfer(groupId)`
- **THEN** the banner disappears and ownership stays with the current owner

### Requirement: Owner can cancel a pending ownership transfer
The system SHALL allow the current owner to cancel a pending ownership transfer before the candidate accepts.

#### Scenario: Cancel transfer
- **WHEN** the current owner sees the `PendingTransferOwnerBanner`
- **WHEN** the owner clicks "Cancelar transferencia"
- **THEN** the system calls `groupsService.cancelOwnershipTransfer(groupId)`
- **THEN** the pending transfer is removed
- **THEN** the banner disappears
