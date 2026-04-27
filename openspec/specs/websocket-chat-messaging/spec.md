# websocket-chat-messaging Specification

## Purpose
TBD - created by archiving change us-o02-observer-real-time-messages. Update Purpose after archive.
## Requirements
### Requirement: Extended Event Handlers
The MessagesGateway SHALL support additional event handlers for advanced chat observation without breaking existing functionality.

#### Scenario: Existing handlers remain functional
- **WHEN** new observation handlers are added to MessagesGateway
- **THEN** all existing handlers SHALL continue to function identically
- **AND** existing clients SHALL NOT be affected by the new handlers

#### Scenario: New handlers coexist with existing handlers
- **WHEN** a client connects to the MessagesGateway
- **THEN** the client SHALL have access to both existing and new event handlers
- **AND** the client MAY choose to subscribe to any combination of events

#### Scenario: Backward compatibility with old clients
- **WHEN** an old client (not aware of new events) connects
- **THEN** the client SHALL function normally with existing events
- **AND** the client SHALL ignore any new events it does not recognize

### Requirement: Type Safety for New Events
All new WebSocket event handlers SHALL use strictly typed DTOs with zero `any` types.

#### Scenario: DTO validation for message:read
- **WHEN** a `message:read` event is emitted
- **THEN** the event payload SHALL conform to `MessageReadDto` interface
- **AND** TypeScript SHALL enforce type checking at compile time

#### Scenario: DTO validation for user:presence
- **WHEN** a `user:presence` event is emitted
- **THEN** the event payload SHALL conform to `UserPresenceDto` interface
- **AND** the `status` field SHALL be restricted to 'online' | 'offline' | 'away'

#### Scenario: DTO validation for group:activity
- **WHEN** a `group:activity` event is emitted
- **THEN** the event payload SHALL conform to `GroupActivityDto` interface
- **AND** the `activity_type` field SHALL be restricted to 'member_joined' | 'member_left' | 'group_updated'

### Requirement: Defensive Programming for New Handlers
All new event handlers SHALL implement defensive programming with try/catch blocks and error logging.

#### Scenario: Error handling in message:read handler
- **WHEN** an error occurs in the `message:read` handler
- **THEN** the system SHALL catch the error and log it using NestJS Logger
- **AND** the system SHALL return an error response to the client
- **AND** the error SHALL NOT crash the WebSocket server

#### Scenario: Error handling in user:presence handler
- **WHEN** an error occurs in the `user:presence` handler
- **THEN** the system SHALL catch the error and log it
- **AND** the system SHALL continue processing other events normally

#### Scenario: Error handling in group:activity handler
- **WHEN** an error occurs in the `group:activity` handler
- **THEN** the system SHALL catch the error and log it
- **AND** the system SHALL return a descriptive error message to the client

### Requirement: Logging for Observable Events
All new observable events SHALL be logged using NestJS Logger for debugging and monitoring.

#### Scenario: Log message read events
- **WHEN** a `message:read` event is processed
- **THEN** the system SHALL log the event with level 'log'
- **AND** the log SHALL include `id_message`, `id_user`, and `id_group`

#### Scenario: Log presence change events
- **WHEN** a `user:presence` event is processed
- **THEN** the system SHALL log the presence change with level 'log'
- **AND** the log SHALL include `id_user`, `status`, and `id_group`

#### Scenario: Log group activity events
- **WHEN** a `group:activity` event is processed
- **THEN** the system SHALL log the activity with level 'log'
- **AND** the log SHALL include `activity_type`, `actor_id`, and `id_group`

#### Scenario: Log errors with stack traces
- **WHEN** an error occurs in any new handler
- **THEN** the system SHALL log the error with level 'error'
- **AND** the log SHALL include the full error stack trace for debugging

