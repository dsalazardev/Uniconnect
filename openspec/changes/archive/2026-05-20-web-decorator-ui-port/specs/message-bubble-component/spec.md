## ADDED Requirements

### Requirement: MessageBubble component orchestrates decorators
The MessageBubble component SHALL compose the three decorator components (BaseMessage, WithFileAttachment, WithMentions) in a chain to render a complete message.

#### Scenario: Full message with text, files, and mention
- **WHEN** a message has text_content, files, and the text mentions the current user
- **THEN** MessageBubble SHALL render: WithMentions > WithFileAttachment > BaseMessage

#### Scenario: Text-only message
- **WHEN** a message has text_content but no files and no mention
- **THEN** MessageBubble SHALL render BaseMessage wrapped in a bubble styled container

#### Scenario: File-only message (no text)
- **WHEN** a message has files but empty or null text_content
- **THEN** MessageBubble SHALL render WithFileAttachment wrapping null (files only)

#### Scenario: Own message styling
- **WHEN** `isOwnMessage` is true
- **THEN** the bubble SHALL have background `#D9B97E` (gold) and align to the right

#### Scenario: Other user's message styling
- **WHEN** `isOwnMessage` is false
- **THEN** the bubble SHALL have background `#3a3a3a` (dark) and align to the left

#### Scenario: Edited badge
- **WHEN** `message.is_edited` is true
- **THEN** an italic "editado" label SHALL appear below the message text

#### Scenario: Sender info in group chats
- **WHEN** `showSenderInfo` is true
- **THEN** the sender's name and avatar SHALL be displayed above the bubble

#### Scenario: Timestamp display
- **WHEN** rendering any message
- **THEN** the timestamp (`send_at`) SHALL be displayed in 24h format below the bubble

### Requirement: MessageBubble accepts action callbacks
MessageBubble SHALL accept optional callbacks for edit, delete, and file download actions.

#### Scenario: Edit action
- **WHEN** `onEdit` callback is provided and user clicks Edit
- **THEN** the callback SHALL be invoked with the message object

#### Scenario: Delete action
- **WHEN** `onDelete` callback is provided and user clicks Delete
- **THEN** the callback SHALL be invoked with the message id_message

#### Scenario: File download action
- **WHEN** `onFilePress` callback is provided and user clicks a file
- **THEN** the callback SHALL be invoked with `{ id_file, file_name }`
