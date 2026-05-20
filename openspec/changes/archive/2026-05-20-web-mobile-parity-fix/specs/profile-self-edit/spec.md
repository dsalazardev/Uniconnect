## ADDED Requirements

### Requirement: ProfileScreen uses `useProfile` hook

The system SHALL fetch profile data via `useProfile()` hook instead of reading directly from `authStore.user`.

#### Scenario: Hook loading — shows spinner
- **WHEN** `useProfile()` returns `isLoading: true`
- **THEN** the system SHALL render a loading spinner

#### Scenario: Hook error — shows error state
- **WHEN** `useProfile()` returns `isError: true`
- **THEN** the system SHALL render an error message with retry option

#### Scenario: Hook success — shows profile data
- **WHEN** `useProfile()` returns profile data
- **THEN** the system SHALL render name, email, phone, program, semester, and courses from the fetched data

### Requirement: ProfileScreen supports editing phone and bio

The system SHALL allow the authenticated user to edit their phone number and "Sobre ti" bio via an edit button and modal.

#### Scenario: Edit button opens modal
- **WHEN** the user clicks "Editar Perfil"
- **THEN** the system SHALL open a modal with editable fields for phone and "Sobre ti"

#### Scenario: Save updates profile
- **WHEN** the user modifies fields and clicks "Guardar"
- **THEN** the system SHALL call `updateProfile` mutation and invalidate the profile query cache

#### Scenario: Save success — shows toast
- **WHEN** the update succeeds
- **THEN** the system SHALL show a success toast and close the modal

#### Scenario: Save error — shows error toast
- **WHEN** the update fails
- **THEN** the system SHALL show an error toast and keep the modal open

### Requirement: ProfileScreen displays student courses

The system SHALL display the authenticated user's enrolled courses from `useProfile().courses`.

#### Scenario: Courses exist — shows list
- **WHEN** `courses` is a non-empty array
- **THEN** the system SHALL render a "Mis Cursos" section with each course name and state

#### Scenario: No courses — shows empty message
- **WHEN** `courses` is empty or undefined
- **THEN** the system SHALL display "No hay cursos disponibles"
