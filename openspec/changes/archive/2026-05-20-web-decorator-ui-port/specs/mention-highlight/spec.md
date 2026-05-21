## ADDED Requirements

### Requirement: Parse and highlight @mentions in message text
The system SHALL parse `@username` patterns in `message.text_content` and render them with distinct visual styling.

#### Scenario: Render text with mention highlighted
- **WHEN** a message contains `@username` in its text_content
- **THEN** the `@username` portion SHALL be rendered in color `#38BDF8` with `font-weight: 700` and the surrounding text SHALL be rendered normally

#### Scenario: Render text without mentions
- **WHEN** a message text_content contains no `@` patterns
- **THEN** all text SHALL be rendered as plain unstyled text

#### Scenario: Handle multiple mentions in one message
- **WHEN** a message contains multiple `@username` patterns (e.g., "Hola @Juan y @Maria")
- **THEN** each `@username` SHALL be highlighted independently

#### Scenario: Handle mention at start and end of text
- **WHEN** a message starts with `@username` or ends with `@username`
- **THEN** the mention SHALL still be highlighted correctly at any position

#### Scenario: Render empty or whitespace-only text
- **WHEN** text_content is null, undefined, or only whitespace
- **THEN** the component SHALL return null (render nothing)

### Requirement: Mention regex pattern
The system SHALL match `@` followed by word characters (letters, numbers, hyphens, dots) as a valid mention.

#### Scenario: Match alphanumeric usernames
- **WHEN** text contains `@user123` or `@maria-garcia`
- **THEN** the full pattern SHALL be captured as a mention

#### Scenario: Not match email addresses
- **WHEN** text contains an email like `user@domain.com`
- **THEN** the `@domain.com` portion SHALL NOT be highlighted as a mention
