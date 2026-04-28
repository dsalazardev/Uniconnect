# Specification: Message Decorator Pattern

## ADDED Requirements

### Requirement: IMensaje interface defines message contract
The system SHALL define an `IMensaje` interface with methods `getContenido(): string`, `getMetadata(): Record<string, any>`, and `render(): string` that all message implementations MUST implement.

#### Scenario: Interface contract enforcement
- **WHEN** a class implements `IMensaje`
- **THEN** it MUST provide implementations for `getContenido()`, `getMetadata()`, and `render()`

### Requirement: MensajeBase implements plain text messages
The system SHALL provide a `MensajeBase` class that implements `IMensaje` for plain text messages with userId and timestamp.

#### Scenario: Plain text message creation
- **WHEN** a `MensajeBase` is instantiated with text content, userId, and timestamp
- **THEN** `getContenido()` returns the text content
- **THEN** `getMetadata()` returns an object with userId and timestamp
- **THEN** `render()` returns a JSON string with structure `{ text: string }`

### Requirement: MensajeDecorator provides abstract decorator base
The system SHALL provide an abstract `MensajeDecorator` class that implements `IMensaje` and delegates to a wrapped `IMensaje` component.

#### Scenario: Decorator delegation
- **WHEN** a concrete decorator extends `MensajeDecorator` and wraps a message
- **THEN** calling `getContenido()` on the decorator delegates to the wrapped message
- **THEN** calling `getMetadata()` on the decorator delegates to the wrapped message
- **THEN** calling `render()` on the decorator can extend the wrapped message's render output

### Requirement: MensajeConArchivo decorator adds file attachments
The system SHALL provide a `MensajeConArchivo` decorator that adds file attachment metadata (url, fileName, mimeType, size) to messages.

#### Scenario: Single file attachment
- **WHEN** a message is decorated with `MensajeConArchivo` with one file
- **THEN** `render()` returns JSON with a `files` array containing one object with url, name, mimeType, and size

#### Scenario: Multiple file attachments
- **WHEN** a message is decorated with `MensajeConArchivo` with multiple files
- **THEN** `render()` returns JSON with a `files` array containing all file objects in order

#### Scenario: File attachment with plain text
- **WHEN** a `MensajeBase` with text is decorated with `MensajeConArchivo`
- **THEN** `render()` returns JSON with both `text` and `files` properties

### Requirement: MensajeConMencion decorator adds user mentions
The system SHALL provide a `MensajeConMencion` decorator that adds user mention metadata (userId, displayName, position) to messages.

#### Scenario: Single user mention
- **WHEN** a message is decorated with `MensajeConMencion` with one mention
- **THEN** `render()` returns JSON with a `mentions` array containing one object with userId, displayName, and position

#### Scenario: Multiple user mentions
- **WHEN** a message is decorated with `MensajeConMencion` with multiple mentions
- **THEN** `render()` returns JSON with a `mentions` array containing all mention objects ordered by position

#### Scenario: Mention position validation
- **WHEN** a mention has a position value
- **THEN** the position MUST be a non-negative integer representing the character index in the text content

### Requirement: MensajeConReaccion decorator adds emoji reactions
The system SHALL provide a `MensajeConReaccion` decorator that adds emoji reaction metadata (emoji, count, users array) to messages.

#### Scenario: Single reaction type
- **WHEN** a message is decorated with `MensajeConReaccion` with one reaction type
- **THEN** `render()` returns JSON with a `reactions` array containing one object with emoji, count, and users array

#### Scenario: Multiple reaction types
- **WHEN** a message is decorated with `MensajeConReaccion` with multiple reaction types
- **THEN** `render()` returns JSON with a `reactions` array containing all reaction objects

#### Scenario: Reaction count consistency
- **WHEN** a reaction object is rendered
- **THEN** the `count` property MUST equal the length of the `users` array

### Requirement: Decorators support composition
The system SHALL allow multiple decorators to be composed on a single message in any order.

#### Scenario: File and mention composition
- **WHEN** a message is decorated with both `MensajeConArchivo` and `MensajeConMencion`
- **THEN** `render()` returns JSON with both `files` and `mentions` properties

#### Scenario: All decorators composition
- **WHEN** a message is decorated with `MensajeConArchivo`, `MensajeConMencion`, and `MensajeConReaccion`
- **THEN** `render()` returns JSON with `text`, `files`, `mentions`, and `reactions` properties

#### Scenario: Decorator order independence
- **WHEN** decorators are applied in different orders
- **THEN** the final `render()` output MUST contain the same properties regardless of order

### Requirement: MessageDto extends with decorator fields
The system SHALL extend `MessageDto` with optional fields `mentions`, `files`, `reactions`, and `rendered_content`.

#### Scenario: Optional field validation
- **WHEN** a `MessageDto` is created without decorator fields
- **THEN** validation MUST pass and fields default to undefined

#### Scenario: Mentions field validation
- **WHEN** a `MessageDto` includes a `mentions` field
- **THEN** it MUST be an array of objects with userId (number), displayName (string), and position (number)

#### Scenario: Files field validation
- **WHEN** a `MessageDto` includes a `files` field
- **THEN** it MUST be an array of objects with url (string), name (string), mimeType (string), and size (number)

#### Scenario: Reactions field validation
- **WHEN** a `MessageDto` includes a `reactions` field
- **THEN** it MUST be an array of objects with emoji (string), count (number), and users (number array)

#### Scenario: Rendered content validation
- **WHEN** a `MessageDto` includes a `rendered_content` field
- **THEN** it MUST be a valid JSON string

### Requirement: MessagesService applies decorators before persistence
The system SHALL update `MessagesService.applyDecorators()` to instantiate the decorator chain based on DTO fields and generate `rendered_content`.

#### Scenario: No decorators applied
- **WHEN** a message DTO has no decorator fields (mentions, files, reactions)
- **THEN** `applyDecorators()` creates only `MensajeBase` and generates minimal JSON with text only

#### Scenario: File decorator applied
- **WHEN** a message DTO includes `files` array
- **THEN** `applyDecorators()` wraps the message with `MensajeConArchivo` and includes files in `rendered_content`

#### Scenario: Mention decorator applied
- **WHEN** a message DTO includes `mentions` array
- **THEN** `applyDecorators()` wraps the message with `MensajeConMencion` and includes mentions in `rendered_content`

#### Scenario: Reaction decorator applied
- **WHEN** a message DTO includes `reactions` array
- **THEN** `applyDecorators()` wraps the message with `MensajeConReaccion` and includes reactions in `rendered_content`

#### Scenario: Multiple decorators applied
- **WHEN** a message DTO includes multiple decorator fields
- **THEN** `applyDecorators()` applies decorators in order (File → Mention → Reaction) and generates complete `rendered_content`

#### Scenario: Rendered content persisted
- **WHEN** `applyDecorators()` generates `rendered_content`
- **THEN** the DTO returned MUST include the `rendered_content` field for persistence

### Requirement: Prisma schema includes rendered_content field
The system SHALL add a `rendered_content` field of type TEXT to the `message` model in Prisma schema.

#### Scenario: Schema migration
- **WHEN** the Prisma migration is executed
- **THEN** the `message` table MUST have a `rendered_content` column of type TEXT

#### Scenario: Nullable field
- **WHEN** the `rendered_content` field is added
- **THEN** it MUST be nullable to support legacy messages without decorator data

#### Scenario: Legacy message compatibility
- **WHEN** an existing message is queried
- **THEN** the `rendered_content` field MAY be NULL and the system MUST handle this gracefully

### Requirement: Decorator pattern documented with UML
The system SHALL include a README.md in `src/messages/domain/decorator/` with a Mermaid UML class diagram documenting the decorator pattern structure.

#### Scenario: UML diagram completeness
- **WHEN** the README.md is viewed
- **THEN** it MUST include a Mermaid diagram showing `IMensaje`, `MensajeBase`, `MensajeDecorator`, and all concrete decorators

#### Scenario: Diagram relationships
- **WHEN** the UML diagram is rendered
- **THEN** it MUST show inheritance relationships (MensajeBase implements IMensaje, MensajeDecorator implements IMensaje, concrete decorators extend MensajeDecorator)
- **THEN** it MUST show composition relationships (MensajeDecorator wraps IMensaje)

### Requirement: Decorator implementation maintains Zero-Any policy
The system SHALL implement all decorator classes with strict TypeScript typing and zero usage of `any` type.

#### Scenario: Type safety enforcement
- **WHEN** decorator classes are implemented
- **THEN** all method signatures MUST use explicit types
- **THEN** no `any` type MUST be used in parameters, return types, or internal variables

#### Scenario: Metadata typing
- **WHEN** `getMetadata()` returns metadata
- **THEN** it MUST return a typed object, not `Record<string, any>`

### Requirement: Decorator integration with Observer pattern
The system SHALL ensure decorators are applied BEFORE the Observer pattern notifies listeners.

#### Scenario: Decorator before Observer
- **WHEN** `MessagesService.sendMessage()` is called
- **THEN** `applyDecorators()` MUST execute before `chatSubject.notify()`

#### Scenario: Observer receives decorated message
- **WHEN** the Observer pattern notifies listeners
- **THEN** the message DTO MUST include the `rendered_content` field generated by decorators

#### Scenario: Persistence before notification
- **WHEN** a message is persisted to the database
- **THEN** it MUST include the `rendered_content` field before the Observer emits the message via WebSocket
