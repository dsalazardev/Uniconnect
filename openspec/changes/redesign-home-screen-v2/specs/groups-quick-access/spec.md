# Spec: Groups Quick Access

## ADDED Requirements

### Requirement: Section displays user's groups
The "Mis Grupos" section SHALL display groups where the current user is a member. Groups SHALL be fetched from the groups feature store or API. Maximum 4 groups SHALL be displayed with a "Ver todos" link to navigate to groups tab.

#### Scenario: Section displays user groups
- **WHEN** user is member of 6 groups
- **THEN** section displays first 4 groups
- **THEN** "Ver todos" link is visible

#### Scenario: Section shows empty state
- **WHEN** user is not member of any group
- **THEN** section displays "No eres miembro de ningún grupo" message
- **THEN** "Explorar grupos" button is shown

### Requirement: Group cards use premium styling
Group cards SHALL use background rgba(26, 26, 26, 0.9), border 1px solid rgba(217, 185, 126, 0.2), and border radius 10px. On hover/focus, border SHALL change to rgba(217, 185, 126, 0.5) with gold glow effect.

#### Scenario: Card applies premium styling
- **WHEN** group card renders
- **THEN** background is rgba(26, 26, 26, 0.9)
- **THEN** border is 1px solid rgba(217, 185, 126, 0.2)
- **THEN** border radius is 10px

#### Scenario: Card shows hover effect on desktop
- **WHEN** user hovers over group card on desktop
- **THEN** border color changes to rgba(217, 185, 126, 0.5)
- **THEN** transition is smooth (200ms)

### Requirement: Cards display group info
Each card SHALL display group name, course name, member count, and group icon. Cards SHALL be tappable to navigate to `/groups/${group.id_group}`.

#### Scenario: Card displays complete info
- **WHEN** group card renders
- **THEN** group name is displayed in fontSize.lg (14px), fontWeight.semibold
- **THEN** course name is displayed in fontSize.sm (11px), color gold
- **THEN** member count is displayed with person icon

#### Scenario: Tapping card navigates to group detail
- **WHEN** user taps group card with id_group 10
- **THEN** system navigates to /groups/10
