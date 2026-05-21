## ADDED Requirements

### Requirement: Toast notification system
The web SHALL provide a production-quality toast notification system replacing the current `console.log` stub.

#### Scenario: Success toast
- **WHEN** `showToast.success('Título', 'Mensaje')` is called
- **THEN** a green toast notification SHALL appear on screen with the title and message
- **THEN** the toast SHALL auto-dismiss after 3-4 seconds

#### Scenario: Error toast
- **WHEN** `showToast.error('Error', 'Mensaje de error')` is called
- **THEN** a red toast notification SHALL appear with the title and message
- **THEN** the toast SHALL auto-dismiss after 4-5 seconds

#### Scenario: Info toast
- **WHEN** `showToast.info('Info', 'Mensaje informativo')` is called
- **THEN** a blue/gray toast notification SHALL appear with the title and message
- **THEN** the toast SHALL auto-dismiss after 3 seconds

#### Scenario: ToastProvider wraps the app
- **WHEN** the application renders
- **THEN** a `<Toaster />` component SHALL be rendered in the Layout or AppRoot
- **THEN** `showToast` calls SHALL trigger visible toasts

### Requirement: Backward-compatible API
The `showToast` object SHALL maintain the same API surface as the current stub.

#### Scenario: Existing callers work unchanged
- **WHEN** existing code calls `showToast.success(title, message)`, `showToast.error(title, message)`, or `showToast.info(title, message)`
- **THEN** the calls SHALL work without modification
- **THEN** the calls SHALL produce visible toast notifications (not console.log)
