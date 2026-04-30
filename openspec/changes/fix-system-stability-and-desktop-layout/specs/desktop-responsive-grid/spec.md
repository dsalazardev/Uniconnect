## ADDED Requirements

### Requirement: Three-column layout for desktop

The system SHALL display a three-column grid layout on desktop screens (≥ 1024px width).

#### Scenario: Desktop screen (1920x1080)
- **WHEN** user views Home screen on desktop with width ≥ 1024px
- **THEN** layout displays three columns: Sidebar (250px) + Feed (flexible) + Panel (300px)
- **THEN** total max-width is 1600px centered on screen

#### Scenario: Tablet screen (768-1023px)
- **WHEN** user views Home screen on tablet with width 768-1023px
- **THEN** layout displays single column with padding
- **THEN** sidebars are hidden

#### Scenario: Mobile screen (< 768px)
- **WHEN** user views Home screen on mobile with width < 768px
- **THEN** layout displays single column full-width
- **THEN** sidebars are hidden

### Requirement: Left sidebar navigation

The system SHALL display navigation links in left sidebar on desktop.

#### Scenario: Sidebar content
- **WHEN** desktop layout is active
- **THEN** left sidebar displays user profile section
- **THEN** left sidebar displays navigation links (Home, Events, Groups, Community, Connections, Notifications, Profile)
- **THEN** current route is highlighted

#### Scenario: Sidebar interaction
- **WHEN** user clicks navigation link in sidebar
- **THEN** app navigates to corresponding route
- **THEN** sidebar remains visible

### Requirement: Center feed with max-width

The system SHALL limit center feed width for optimal readability.

#### Scenario: Feed on large monitor (4K)
- **WHEN** user views Home on 4K monitor (3840px width)
- **THEN** center feed max-width is 800px
- **THEN** content does not stretch beyond readable width

#### Scenario: Feed content
- **WHEN** desktop layout is active
- **THEN** center feed displays events carousel
- **THEN** center feed displays faculty filters
- **THEN** center feed displays "Mis Grupos" section

### Requirement: Right panel for groups

The system SHALL display featured groups in right panel on desktop.

#### Scenario: Panel content
- **WHEN** desktop layout is active
- **THEN** right panel displays "Grupos Destacados" section
- **THEN** right panel displays up to 5 featured groups
- **THEN** each group shows name, member count, and join button

#### Scenario: Panel interaction
- **WHEN** user clicks group in right panel
- **THEN** app navigates to group detail screen
- **THEN** panel remains visible on return

### Requirement: Responsive breakpoint transitions

The system SHALL smoothly transition between layouts at breakpoints.

#### Scenario: Resize from desktop to tablet
- **WHEN** window width decreases from 1024px to 1023px
- **THEN** sidebars fade out
- **THEN** center feed expands to full width
- **THEN** no content is lost

#### Scenario: Resize from tablet to desktop
- **WHEN** window width increases from 1023px to 1024px
- **THEN** sidebars fade in
- **THEN** center feed contracts to max-width
- **THEN** layout is centered

### Requirement: Prevent content stretching on large monitors

The system SHALL prevent content from stretching excessively on large monitors.

#### Scenario: 4K monitor (3840x2160)
- **WHEN** user views Home on 4K monitor
- **THEN** total layout max-width is 1600px
- **THEN** layout is horizontally centered
- **THEN** background fills remaining space

#### Scenario: Ultrawide monitor (3440x1440)
- **WHEN** user views Home on ultrawide monitor
- **THEN** total layout max-width is 1600px
- **THEN** layout is horizontally centered
- **THEN** sidebars do not exceed fixed widths
