## ADDED Requirements

### Requirement: Emoji picker in message input
The MessageInput component SHALL include a button that opens an emoji picker modal.

#### Scenario: Open emoji picker
- **WHEN** the user clicks the emoji button (smiley face icon) next to the message input
- **THEN** a modal SHALL open displaying a grid of emoji options

#### Scenario: Close emoji picker
- **WHEN** the user clicks the close button on the emoji picker
- **THEN** the modal SHALL close

#### Scenario: Select emoji
- **WHEN** the user clicks an emoji in the picker
- **THEN** the emoji SHALL be inserted at the cursor position in the message input text
- **THEN** the emoji picker SHALL close automatically

### Requirement: Popular emoji set
The emoji picker SHALL display a curated set of popular emojis (56 emojis covering faces, gestures, hearts, animals, symbols, and celebration icons).

#### Scenario: Display 56 emojis
- **WHEN** the emoji picker opens
- **THEN** it SHALL display exactly the 56 emojis from the POPULAR_EMOJIS constant
- **THEN** the emojis SHALL be arranged in a grid layout

#### Scenario: Emoji grid layout
- **WHEN** displayed
- **THEN** the emoji grid SHALL use CSS Grid with 5 columns
- **THEN** each emoji SHALL be rendered at a large font size for easy tapping
