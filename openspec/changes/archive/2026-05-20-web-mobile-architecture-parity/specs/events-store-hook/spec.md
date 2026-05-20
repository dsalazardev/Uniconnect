## ADDED Requirements

### Requirement: useEvents hook
The events feature SHALL provide a `useEvents` React hook that returns all events store state and actions.

#### Scenario: Hook returns store state
- **WHEN** `useEvents()` is called in a component
- **THEN** it SHALL return `{ events, loading, error, filters, metadata, upcomingEvents, isCreating, createError, isUpdating, updateError }`

#### Scenario: Hook provides store actions
- **WHEN** `useEvents()` is called in a component
- **THEN** it SHALL return action functions: `loadEvents`, `setFilter`, `clearFilters`, `createEvent`, `updateEvent`, `deleteEvent`, `clearCreateError`, `clearUpdateError`

#### Scenario: Auto-load on mount
- **WHEN** a component mounts and calls `useEvents()`
- **THEN** if `eventsStore.events.length === 0` and `!eventsStore.loading`, the system SHALL call `eventsStore.loadEvents()`

### Requirement: EventsPage route wrapper
The router SHALL use an `EventsPage` wrapper component that connects `useEvents` to `EventList`.

#### Scenario: Events route renders with data
- **WHEN** navigating to `/events`
- **THEN** the system SHALL render `EventList` with events from the store
- **THEN** the system SHALL render `EventFilters` connected to the store's filter state
- **THEN** the system SHALL render a "Crear Evento" button for admin/superadmin users
