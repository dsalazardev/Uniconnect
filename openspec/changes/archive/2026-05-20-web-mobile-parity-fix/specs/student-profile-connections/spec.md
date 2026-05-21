## ADDED Requirements

### Requirement: Student profile shows connection status

The system SHALL display the current connection status between the authenticated user and the viewed student on the StudentProfile page at `/students/:id`.

#### Scenario: Not connected — shows "Conectar" button
- **WHEN** the authenticated user views a student's profile AND there is no existing connection
- **THEN** the system SHALL display a "Conectar" button

#### Scenario: Connection pending — current user is requester
- **WHEN** the authenticated user views a student's profile AND has sent a pending connection request
- **THEN** the system SHALL display "Solicitud enviada" with disabled button

#### Scenario: Connection pending — current user is addressee
- **WHEN** the authenticated user views a student's profile AND has received a pending connection request
- **THEN** the system SHALL display "Aceptar" and "Rechazar" buttons

#### Scenario: Connection accepted — shows "Amigos" status
- **WHEN** the authenticated user views a student's profile AND the connection is accepted
- **THEN** the system SHALL display "Amigos" badge

### Requirement: Student profile has "Enviar Mensaje" button

The system SHALL provide a button to open a direct message chat with the viewed student when a connection exists.

#### Scenario: Connection exists — opens chat
- **WHEN** the user clicks "Enviar Mensaje" AND the connection is accepted
- **THEN** the system SHALL navigate to the group chat for their direct message

#### Scenario: No connection — shows error toast
- **WHEN** the user clicks "Enviar Mensaje" AND there is no accepted connection
- **THEN** the system SHALL display an error toast "No tienes una conexión aceptada con este usuario"

### Requirement: StudentProfile destructuring is correct

The system SHALL correctly destructure `useStudentProfile` return values to prevent flash-of-error.

#### Scenario: Loading state shows spinner
- **WHEN** `isLoading` is `true`
- **THEN** the system SHALL render a loading spinner with text "Cargando perfil..."

#### Scenario: Error or null data shows error screen
- **WHEN** `error` is truthy OR `data` is falsy after loading completes
- **THEN** the system SHALL render "Perfil no encontrado" with a "Volver" button

#### Scenario: Successful load shows profile
- **WHEN** `data` contains a valid student profile
- **THEN** the system SHALL render the full profile view with connection UI
