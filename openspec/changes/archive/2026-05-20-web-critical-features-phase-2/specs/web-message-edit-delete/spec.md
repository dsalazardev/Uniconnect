## ADDED Requirements

### Requirement: Users shall edit and delete their own messages in chat
The system SHALL provide UI controls for editing and deleting messages that the current user sent.

#### Scenario: User edits own message
- **WHEN** the user clicks the edit action on one of their own messages
- **THEN** the message text becomes editable inline or in a modal
- **AND** upon saving, the updated message is sent via `editMessage`
- **AND** the message displays an "editado" indicator

#### Scenario: User deletes own message
- **WHEN** the user clicks the delete action on one of their own messages
- **THEN** a confirmation modal appears
- **AND** upon confirmation, the message is removed via `deleteMessage`

#### Scenario: Non-author cannot edit/delete
- **WHEN** a user attempts to edit or delete a message sent by another user
- **THEN** no edit/delete controls are shown
- **AND** the message remains unchanged
