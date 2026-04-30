# Spec: Home Header Branding

## ADDED Requirements

### Requirement: Header displays Uniconnect branding
The header SHALL display "Uniconnect" as the primary identifier using Roboto Bold font at 24px (5xl) with Gold color (#D9B97E). The header SHALL NOT include informal greetings, emojis, or user first names.

#### Scenario: Header renders with correct branding
- **WHEN** user views the home screen
- **THEN** header displays "Uniconnect" text in Roboto Bold, 24px, color #D9B97E
- **THEN** header does NOT display "¡Hola", "👋", or user's first name

#### Scenario: Header maintains branding on mobile
- **WHEN** user views home screen on mobile device (width < 768px)
- **THEN** "Uniconnect" text remains visible and properly sized
- **THEN** branding does not wrap or truncate

### Requirement: Header displays institutional logo
The header SHALL display the Universidad de Caldas logo from `assets/Logo_de_la_Universidad_de_Caldas.svg.png` positioned to the left of the "Uniconnect" text.

#### Scenario: Logo renders correctly
- **WHEN** user views the home screen
- **THEN** Universidad de Caldas logo is visible
- **THEN** logo is positioned to the left of "Uniconnect" text
- **THEN** logo maintains aspect ratio and proper sizing

#### Scenario: Logo is accessible
- **WHEN** screen reader user navigates header
- **THEN** logo has accessible label "Logo Universidad de Caldas"

### Requirement: Header displays notification badge
The header SHALL display a notification badge on the right side showing the count of unread notifications. The badge SHALL use the count badge design pattern from DESIGN_TOKENS.md (minWidth 22px, height 22px, borderRadius 11px, background rgba(249, 115, 22, 0.25)).

#### Scenario: Badge shows unread count
- **WHEN** user has 3 unread notifications
- **THEN** badge displays "3" in white text
- **THEN** badge uses warning background color rgba(249, 115, 22, 0.25)

#### Scenario: Badge hidden when no notifications
- **WHEN** user has 0 unread notifications
- **THEN** notification badge is not rendered

#### Scenario: Badge is tappable
- **WHEN** user taps notification badge
- **THEN** system navigates to notifications tab

### Requirement: Header uses design tokens
The header SHALL use tokens from DESIGN_TOKENS.md for all styling: colors.primary.gold for text, spacing[6] (12px) for padding, and typography.fontSize['5xl'] (24px) for title.

#### Scenario: Header applies correct tokens
- **WHEN** header is rendered
- **THEN** title color is #D9B97E (colors.primary.gold)
- **THEN** padding is 12px (spacing[6])
- **THEN** font size is 24px (typography.fontSize['5xl'])
- **THEN** font weight is 700 (typography.fontWeight.bold)
