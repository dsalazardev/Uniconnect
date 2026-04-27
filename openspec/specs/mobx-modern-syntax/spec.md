## ADDED Requirements

### Requirement: MobX stores SHALL use makeAutoObservable pattern
MobX stores in the frontend application SHALL use the `makeAutoObservable(this)` pattern in the constructor instead of decorator syntax (`@observable`, `@action`, `@computed`). This ensures compatibility with Expo/Metro bundler without requiring additional Babel plugins.

#### Scenario: Store initialization with makeAutoObservable
- **WHEN** a MobX store class is instantiated
- **THEN** the constructor SHALL call `makeAutoObservable(this)` to automatically infer observables, actions, and computed values

#### Scenario: Observable properties without decorators
- **WHEN** a store defines state properties (e.g., `events: Event[] = []`)
- **THEN** `makeAutoObservable` SHALL automatically make them observable without requiring `@observable` decorator

#### Scenario: Action methods without decorators
- **WHEN** a store defines methods that modify state (e.g., `async loadEvents()`)
- **THEN** `makeAutoObservable` SHALL automatically make them actions without requiring `@action` decorator

#### Scenario: Computed values without decorators
- **WHEN** a store defines getter methods (e.g., `get upcomingEvents()`)
- **THEN** `makeAutoObservable` SHALL automatically make them computed values without requiring `@computed` decorator

### Requirement: EventsStore SHALL maintain behavioral compatibility
The refactored `EventsStore` using `makeAutoObservable` SHALL maintain 100% behavioral compatibility with the previous decorator-based implementation. All reactivity, state updates, and computed values SHALL work identically.

#### Scenario: Events load reactively
- **WHEN** `loadEvents()` method is called
- **THEN** the `events` array SHALL update reactively and trigger re-renders in observing components

#### Scenario: Filters update reactively
- **WHEN** `setFilter()` method is called with a filter type and value
- **THEN** the `filters` object SHALL update reactively and automatically trigger `loadEvents()`

#### Scenario: Loading states update reactively
- **WHEN** async operations start or complete
- **THEN** the `loading`, `isCreating`, and `isUpdating` flags SHALL update reactively

#### Scenario: Error states update reactively
- **WHEN** API calls fail
- **THEN** the `error`, `createError`, and `updateError` properties SHALL update reactively

#### Scenario: Computed values recalculate automatically
- **WHEN** the `events` array changes
- **THEN** the `upcomingEvents` computed getter SHALL automatically recalculate and return filtered results

### Requirement: Build system SHALL compile without decorator errors
The Expo/Metro bundler SHALL successfully compile the frontend application without requiring Babel decorator transform plugins.

#### Scenario: Successful build without Babel plugins
- **WHEN** the application is built with `npx expo start`
- **THEN** the build SHALL complete successfully without "Decorating class property failed" errors

#### Scenario: Successful build after cache clear
- **WHEN** the application is built with `npx expo start -c` (cache cleared)
- **THEN** the build SHALL complete successfully and serve the updated code

#### Scenario: Web build compatibility
- **WHEN** the application is built for web with `npx expo start --web`
- **THEN** the build SHALL complete successfully without decorator-related errors

### Requirement: TypeScript configuration SHALL support decorators
The `tsconfig.json` file SHALL include `experimentalDecorators: true` in the `compilerOptions` to enable decorator syntax support for future compatibility and library dependencies.

#### Scenario: TypeScript compilation with decorator support
- **WHEN** TypeScript compiles the codebase
- **THEN** the compiler SHALL not emit errors for decorator syntax used by dependencies

#### Scenario: Future decorator usage
- **WHEN** new code or libraries use decorator syntax
- **THEN** TypeScript SHALL compile successfully without requiring configuration changes

### Requirement: Private methods SHALL be excluded from observability
Private methods and properties (prefixed with `_` or marked with `private` keyword) SHALL be automatically excluded from MobX observability by `makeAutoObservable`.

#### Scenario: Private setter methods
- **WHEN** a store defines private methods like `private setEvents()`
- **THEN** `makeAutoObservable` SHALL exclude them from action wrapping while still allowing them to modify state

#### Scenario: Private properties
- **WHEN** a store defines private properties like `private eventsService`
- **THEN** `makeAutoObservable` SHALL exclude them from observable tracking

### Requirement: Store singleton SHALL remain functional
The exported singleton instance `eventsStore` SHALL continue to work correctly with the refactored class implementation.

#### Scenario: Singleton instantiation
- **WHEN** the module is imported
- **THEN** the singleton `eventsStore` SHALL be instantiated with `makeAutoObservable` applied

#### Scenario: Singleton usage in components
- **WHEN** components import and use `eventsStore`
- **THEN** the store SHALL provide reactive state and methods identical to the decorator-based version
