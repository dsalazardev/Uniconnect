# Spec: Desktop Sidebar

## ADDED Requirements

### Requirement: Sidebar renders only on desktop
The sidebar SHALL render only when useResponsive returns isDesktop: true (width ≥ 1024px). Sidebar SHALL be fixed width 240px and positioned on the left side of the layout.

#### Scenario: Sidebar renders on desktop
- **WHEN** screen width is ≥ 1024px
- **THEN** sidebar is rendered
- **THEN** sidebar width is 240px
- **THEN** sidebar is positioned on the left

#### Scenario: Sidebar hidden on mobile
- **WHEN** screen width is < 768px
- **THEN** sidebar is NOT rendered

### Requirement: Sidebar displays navigation links
Sidebar SHALL display navigation links to main tabs: Inicio (current), Eventos, Grupos, Comunidad, Conexiones, Notificaciones, Perfil. Current tab SHALL be highlighted with gold color and background rgba(217, 185, 126, 0.1).

#### Scenario: Navigation links are displayed
- **WHEN** sidebar renders
- **THEN** all 7 navigation links are visible
- **THEN** each link has icon and label

#### Scenario: Current tab is highlighted
- **WHEN** user is on home screen
- **THEN** "Inicio" link has gold text color (#D9B97E)
- **THEN** "Inicio" link has background rgba(217, 185, 126, 0.1)
- **THEN** other links have default styling

### Requirement: Links are tappable and navigate
Each link SHALL be wrapped in TouchableOpacity with onPress handler that navigates to the corresponding tab using Expo Router.

#### Scenario: Tapping link navigates to tab
- **WHEN** user taps "Eventos" link
- **THEN** system navigates to /(tabs)/events
- **THEN** sidebar updates to highlight "Eventos"

### Requirement: Sidebar uses design tokens
Sidebar SHALL use background #0d0d0d (colors.background.header), padding 16px (spacing[8]), gap 8px (gap.md), and typography fontSize.lg (14px) for labels.

#### Scenario: Sidebar applies correct tokens
- **WHEN** sidebar renders
- **THEN** background is #0d0d0d
- **THEN** padding is 16px
- **THEN** gap between links is 8px
- **THEN** label font size is 14px
