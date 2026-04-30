# Spec: Faculty Filters

## ADDED Requirements

### Requirement: Filters display as horizontal chips
Filter chips SHALL be displayed in a horizontal ScrollView with chip styling: paddingVertical 6px, paddingHorizontal 14px, borderRadius 20px, border 1px solid rgba(217, 185, 126, 0.3), background rgba(217, 185, 126, 0.05). Active chip SHALL use border #D9B97E and background rgba(217, 185, 126, 0.15).

#### Scenario: Chips render with correct styling
- **WHEN** filters render
- **THEN** each chip has paddingVertical 6px, paddingHorizontal 14px
- **THEN** border radius is 20px
- **THEN** inactive chips have border rgba(217, 185, 126, 0.3)

#### Scenario: Active chip has highlighted styling
- **WHEN** user selects "Ingeniería" filter
- **THEN** chip border is #D9B97E
- **THEN** chip background is rgba(217, 185, 126, 0.15)
- **THEN** text color is #D9B97E

### Requirement: Filters include faculty and semester options
Filters SHALL include options for all faculties from the Universidad de Caldas (Ingeniería, Salud, Ciencias Exactas, Jurídicas, Agropecuarias, Artes) and semester options (1-10, "Todos").

#### Scenario: Faculty filters are available
- **WHEN** user opens faculty filter
- **THEN** all 6 faculties are listed
- **THEN** "Todas las facultades" option is available

#### Scenario: Semester filters are available
- **WHEN** user opens semester filter
- **THEN** options 1-10 and "Todos" are listed

### Requirement: Filters affect events and groups display
When a filter is selected, events carousel and groups section SHALL filter content to show only items matching the selected faculty/semester. Filters SHALL be applied client-side without API calls.

#### Scenario: Faculty filter affects events
- **WHEN** user selects "Ingeniería" faculty filter
- **THEN** events carousel shows only events for Ingeniería programs
- **THEN** other events are hidden

#### Scenario: Semester filter affects groups
- **WHEN** user selects "Semestre 5" filter
- **THEN** groups section shows only groups for semester 5 courses
- **THEN** other groups are hidden

#### Scenario: Clearing filters shows all content
- **WHEN** user selects "Todos" filter
- **THEN** all events and groups are displayed
- **THEN** no filtering is applied
