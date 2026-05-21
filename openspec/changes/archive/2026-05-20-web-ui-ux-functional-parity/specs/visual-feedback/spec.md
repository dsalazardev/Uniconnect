## ADDED Requirements

### Requirement: Suspense fallback shows loading spinner during lazy load
The `SuspenseWrapper` component in `router.tsx` SHALL display a loading spinner instead of `null` while the `LoginScreen` module is being lazy-loaded.

#### Scenario: LoginScreen lazy load shows spinner
- **WHEN** the user navigates to `/login` and the `@auth0/auth0-spa-js` module is loading
- **THEN** the system SHALL display a centered loading spinner with "Cargando..." text

#### Scenario: Spinner disappears after load
- **WHEN** the `LoginScreen` module finishes loading
- **THEN** the spinner SHALL be replaced by the `LoginScreen` component

### Requirement: EventsPage shows spinner during loading
The EventsPage SHALL display a spinner component instead of plain `<p>Cargando eventos...</p>` text while events are being fetched.

#### Scenario: EventsPage loading state shows spinner
- **WHEN** the EventsPage mounts and events are being fetched
- **THEN** the system SHALL display `<LoadingSpinner size="lg" label="Cargando eventos..." />`

#### Scenario: EventsPage shows events after load
- **WHEN** events finish loading and `events` array has items
- **THEN** the spinner SHALL be replaced by the `EventList` component

### Requirement: Shared LoadingSpinner component exists
The system SHALL provide a reusable `LoadingSpinner` component at `components/elements/LoadingSpinner.tsx` with configurable `size` (sm/md/lg) and optional `label` text.

#### Scenario: LoadingSpinner renders with size and label
- **WHEN** `<LoadingSpinner size="lg" label="Cargando..." />` is rendered
- **THEN** the component SHALL display an animated spinner and the text "Cargando..."

#### Scenario: LoadingSpinner renders without label
- **WHEN** `<LoadingSpinner size="md" />` is rendered
- **THEN** the component SHALL display only the animated spinner without text
