## ADDED Requirements

### Requirement: Message list container must not show a horizontal scrollbar
The system SHALL hide horizontal overflow in the message list container, showing only a vertical scrollbar when needed.

#### Scenario: No horizontal scrollbar
- **WHEN** the user opens a chat view
- **THEN** the message list container shows only a vertical scrollbar (overflow-y: auto)
- **THEN** no horizontal scrollbar is visible
- **THEN** message bubbles do not exceed 70% of the container width
- **THEN** long file names are truncated with ellipsis
- **THEN** long words break to the next line
