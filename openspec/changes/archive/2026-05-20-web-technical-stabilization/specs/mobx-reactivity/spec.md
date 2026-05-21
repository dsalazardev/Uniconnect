## ADDED Requirements

### Requirement: EventsPage re-renders on filter changes

The `EventsPage` component SHALL be wrapped in MobX `observer()` HOC from `mobx-react-lite` so that changes to `eventsStore.filters`, `eventsStore.events`, `eventsStore.loading`, and `eventsStore.error` trigger React re-renders.

#### Scenario: Filter selection updates UI immediately
- **WHEN** the user selects a filter value in EventFilters (e.g., "Conferencia")
- **THEN** `eventsStore.setFilter('type', 'CONFERENCIA')` is called
- **THEN** `loadEvents()` is triggered by the store
- **THEN** the UI updates to show only matching events without manual page refresh

#### Scenario: Filter clear resets UI immediately
- **WHEN** the user clicks "Limpiar filtros"
- **THEN** `eventsStore.clearFilters()` is called
- **THEN** all events are loaded again
- **THEN** the UI shows the full unfiltered event list

#### Scenario: Event list changes after create/update/delete
- **WHEN** a new event is created, updated, or deleted
- **THEN** `eventsStore` state changes trigger a re-render
- **THEN** the event list reflects the latest data

### Requirement: EventFilters is controlled by props

The `EventFilters` component SHALL remain a pure presentational component receiving `filters`, `onFilterChange`, and `onClearFilters` as props. It SHALL NOT be wrapped in `observer()` itself — reactivity is handled by the parent `EventsPage`.

#### Scenario: EventFilters receives updated filters
- **WHEN** `EventsPage` re-renders due to MobX observer
- **THEN** the new `filters` prop flows down to `EventFilters`
- **THEN** the filter UI shows the correct active filter state
