## ADDED Requirements

### Requirement: Content filtering for chat messages
The system SHALL filter inappropriate content from chat messages before processing using a Custom Method Decorator pattern.

#### Scenario: Message with profanity is blocked
- **WHEN** user sends a message containing words from the prohibited list
- **THEN** system rejects the message and returns descriptive error to user

#### Scenario: Clean message is processed normally
- **WHEN** user sends a message without prohibited content
- **THEN** system processes the message through normal flow without modification

### Requirement: Configurable moderation options
The decorator SHALL accept configuration parameters to customize moderation behavior per method.

#### Scenario: Method with strict moderation
- **WHEN** decorator is applied with `filterProfanity: true, maxLength: 100`
- **THEN** system enforces both profanity filtering and length validation

#### Scenario: Method with lenient moderation
- **WHEN** decorator is applied with `filterProfanity: false, maxLength: 500`
- **THEN** system only validates message length without profanity filtering

### Requirement: Message length validation
The system SHALL validate message length according to decorator configuration.

#### Scenario: Message exceeds maximum length
- **WHEN** user sends message longer than configured maxLength
- **THEN** system rejects message with length limit error

#### Scenario: Message within length limit
- **WHEN** user sends message within configured maxLength
- **THEN** system processes message normally

### Requirement: Moderation activity logging
The system SHALL log all moderation actions for auditing and monitoring purposes.

#### Scenario: Blocked message is logged
- **WHEN** system blocks a message due to prohibited content
- **THEN** system logs the event with timestamp, user ID, group ID, and reason

#### Scenario: Successful moderation is logged
- **WHEN** system processes a clean message through moderation
- **THEN** system logs successful moderation check with basic metadata

### Requirement: Transparent integration with existing methods
The decorator SHALL integrate with existing message processing methods without breaking current functionality.

#### Scenario: WebSocket message processing with decorator
- **WHEN** decorator is applied to MessagesGateway.handleMessage()
- **THEN** WebSocket message flow continues normally after moderation check

#### Scenario: Service method processing with decorator
- **WHEN** decorator is applied to MessagesService.create()
- **THEN** service method flow continues normally after moderation check

### Requirement: Error handling and user feedback
The system SHALL provide clear error messages when content is rejected by moderation.

#### Scenario: Profanity detected error message
- **WHEN** message contains prohibited words
- **THEN** system returns error "Message contains inappropriate content and cannot be sent"

#### Scenario: Length limit error message
- **WHEN** message exceeds length limit
- **THEN** system returns error "Message exceeds maximum length of X characters"