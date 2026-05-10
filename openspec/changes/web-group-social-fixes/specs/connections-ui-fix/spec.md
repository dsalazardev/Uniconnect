## ADDED Requirements

### Requirement: Connection actions must use toast notifications instead of browser alerts
The system SHALL use the existing `showToast` system (react-hot-toast) for success and error feedback in connection request actions, replacing native `window.alert()` calls.

#### Scenario: Successful accept shows toast
- **WHEN** the user accepts a connection request
- **THEN** a success toast appears: "Conexión aceptada"
- **THEN** no `window.alert()` is called

#### Scenario: Successful reject shows toast
- **WHEN** the user rejects a connection request
- **THEN** a success toast appears: "Conexión rechazada"
- **THEN** no `window.alert()` is called

#### Scenario: Error shows error toast
- **WHEN** an accept or reject action fails
- **THEN** an error toast appears with the error message
- **THEN** no `window.alert()` is called
