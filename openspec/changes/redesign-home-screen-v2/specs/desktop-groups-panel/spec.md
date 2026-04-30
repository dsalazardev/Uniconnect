# Spec: Desktop Groups Panel

## ADDED Requirements

### Requirement: Panel renders only on desktop
The right panel SHALL render only when useResponsive returns isDesktop: true (width ≥ 1024px). Panel SHALL be fixed width 300px and positioned on the right side of the layout.

#### Scenario: Panel renders on desktop
- **WHEN** screen width is ≥ 1024px
- **THEN** right panel is rendered
- **THEN** panel width is 300px
- **THEN** panel is positioned on the right

#### Scenario: Panel hidden on mobile
- **WHEN** screen width is < 768px
- **THEN** right panel is NOT rendered

### Requirement: Panel displays featured groups
Panel SHALL display "Grupos Destacados" section with up to 5 groups that have the most members or recent activity. Groups SHALL be displayed as compact cards with group name, member count, and join button.

#### Scenario: Panel displays featured groups
- **WHEN** panel renders
- **THEN** "Grupos Destacados" title is displayed
- **THEN** up to 5 groups are shown
- **THEN** groups are sorted by member count descending

#### Scenario: Compact cards show essential info
- **WHEN** group card renders in panel
- **THEN** group name is displayed in fontSize.md (13px)
- **THEN** member count is displayed with icon
- **THEN** "Unirse" button is visible if user is not member

### Requirement: Panel is scrollable
Panel content SHALL be scrollable vertically if content exceeds panel height. Panel SHALL use background #0d0d0d (colors.background.header) and padding 16px (spacing[8]).

#### Scenario: Panel scrolls when content overflows
- **WHEN** panel content height exceeds screen height
- **THEN** panel is vertically scrollable
- **THEN** scroll indicator is visible

#### Scenario: Panel applies correct styling
- **WHEN** panel renders
- **THEN** background is #0d0d0d
- **THEN** padding is 16px
- **THEN** border left is 1px solid rgba(217, 185, 126, 0.1)

### Requirement: Join button is functional
"Unirse" button SHALL call the groups API to request joining the group. Button SHALL show loading state while request is in progress.

#### Scenario: User can join group from panel
- **WHEN** user taps "Unirse" button for group ID 15
- **THEN** system sends join request to API
- **THEN** button shows loading indicator
- **THEN** on success, button changes to "Solicitado" or "Miembro"
