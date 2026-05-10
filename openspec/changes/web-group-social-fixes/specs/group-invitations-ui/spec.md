## ADDED Requirements

### Requirement: Owner/admin can invite a user to the group
The system SHALL allow the group owner or admin to send a group invitation to another user via a modal.

#### Scenario: Open invite modal
- **WHEN** the group owner or admin clicks "Invitar" button in GroupDetail or GroupAdminPanel
- **THEN** the `InviteMemberModal` opens showing a list of available users

#### Scenario: Send invitation
- **WHEN** the owner/admin selects a user in `InviteMemberModal` and clicks "Invitar"
- **THEN** the system calls `groupsService.sendInvitation({ id_group, inviter_id, invitee_id })`
- **THEN** a success toast appears
- **THEN** the modal closes

### Requirement: User can see and respond to received invitations
The system SHALL display pending group invitations to the user and allow them to accept or reject.

#### Scenario: View pending invitations
- **WHEN** the user navigates to GroupsPage
- **THEN** a third tab "Invitaciones" appears showing pending invitations count
- **WHEN** the user clicks the tab
- **THEN** a list of pending invitations is displayed with group name, inviter name, and Aceptar/Rechazar buttons

#### Scenario: Accept invitation
- **WHEN** the user clicks "Aceptar" on a pending invitation
- **THEN** the system calls `groupsService.respondToInvitation(invitationId, 'accepted')`
- **THEN** a success toast appears
- **THEN** the invitation is removed from the list
- **THEN** the user becomes a member of the group

#### Scenario: Reject invitation
- **WHEN** the user clicks "Rechazar" on a pending invitation
- **WHEN** the user confirms in the confirmation dialog
- **THEN** the system calls `groupsService.respondToInvitation(invitationId, 'rejected')`
- **THEN** the invitation is removed from the list

#### Scenario: Cancel sent invitation
- **WHEN** the owner/admin views sent invitations in the invitations tab
- **WHEN** the owner clicks "Cancelar" on a pending sent invitation
- **THEN** the system calls `groupsService.cancelInvitation(invitationId)`
- **THEN** the invitation is removed from the list
