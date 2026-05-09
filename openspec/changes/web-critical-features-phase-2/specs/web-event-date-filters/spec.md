## ADDED Requirements

### Requirement: Event filters shall include functional date controls
The system SHALL provide input controls for filtering events by start date and end date.

#### Scenario: User selects start date
- **WHEN** the user selects a start date from the date input
- **THEN** the event list refreshes to show only events on or after that date

#### Scenario: User selects end date
- **WHEN** the user selects an end date from the date input
- **THEN** the event list refreshes to show only events on or before that date

#### Scenario: User clears date filters
- **WHEN** the user clicks "Limpiar filtros"
- **THEN** all date inputs are reset
- **AND** the event list shows all events again
