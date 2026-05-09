## ADDED Requirements

### Requirement: Users shall attach files to chat messages
The system SHALL allow users to select and upload files from the message input area.

#### Scenario: User attaches a file
- **WHEN** the user clicks the file attachment button in the message input
- **THEN** a file picker dialog opens
- **AND** upon selecting a file, it is uploaded via `filesService.upload`
- **AND** a message containing the file is sent

#### Scenario: User cancels file selection
- **WHEN** the user opens the file picker and then cancels
- **THEN** no file is uploaded
- **AND** no message is sent

#### Scenario: File upload fails
- **WHEN** a file upload fails
- **THEN** an error toast is displayed
- **AND** the user can retry or dismiss
