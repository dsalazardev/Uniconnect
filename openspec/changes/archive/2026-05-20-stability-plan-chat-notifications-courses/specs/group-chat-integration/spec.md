## ADDED Requirements

### Requirement: Chat section visible only for group members
The GroupDetail component SHALL render a chat interface only when the authenticated user is a member of the group (`isMember === true`).

#### Scenario: Member sees chat
- **WHEN** the user navigates to a group where `isMember === true`
- **THEN** the GroupDetail renders a chat section with a message list and an input field below the group info

#### Scenario: Non-member does not see chat
- **WHEN** the user navigates to a group where `isMember === false`
- **THEN** the GroupDetail does NOT render the chat section

### Requirement: Message list displays group messages
The chat section SHALL display messages fetched from the backend for the specific group.

#### Scenario: Load messages on mount
- **WHEN** the chat section mounts and the user is a member
- **THEN** it fetches messages via `messagesService.getGroupMessages(groupId)` and renders them in chronological order

#### Scenario: Empty chat state
- **WHEN** the group has no messages
- **THEN** the chat section displays "No hay mensajes aún"

### Requirement: Send message functionality
The chat section SHALL provide an input field and a send button to post new messages.

#### Scenario: Send a text message
- **WHEN** the user types text in the input and clicks send
- **THEN** the message is sent via `messagesService.sendMessage(groupId, text)` and the message list refreshes

### Requirement: Leave group button
The GroupDetail SHALL provide a "Abandonar Grupo" button for members who are not the owner.

#### Scenario: Member leaves group
- **WHEN** a non-owner member clicks "Abandonar Grupo"
- **THEN** a confirmation dialog appears, and upon confirmation, `groupsService.leaveGroup(groupId)` is called and the user is redirected to `/groups`

#### Scenario: Owner cannot leave directly
- **WHEN** the owner views the group detail
- **THEN** the "Abandonar Grupo" button is NOT rendered
