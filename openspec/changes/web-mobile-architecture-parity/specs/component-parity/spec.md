## ADDED Requirements

### Requirement: AppRoot initialization gate
The web SHALL provide an `AppRoot` component that blocks rendering until auth is initialized.

#### Scenario: AppRoot shows loading state
- **WHEN** `authStore.isInitialized` is `false`
- **THEN** `AppRoot` SHALL render a loading indicator (spinner + "Cargando...")

#### Scenario: AppRoot shows error state
- **WHEN** auth initialization fails
- **THEN** `AppRoot` SHALL show an error message with a "Reintentar" button

#### Scenario: AppRoot renders children when ready
- **WHEN** `authStore.isInitialized` is `true`
- **THEN** `AppRoot` SHALL render its children

### Requirement: GroupAdminPanel component
The web SHALL provide a `GroupAdminPanel` component for group management (matching mobile's version).

#### Scenario: Admin panel renders for owner/admin
- **WHEN** a user with `canManage` permission views a group
- **THEN** the panel SHALL show member management controls (remove member, promote to admin)
- **THEN** the panel SHALL show transfer ownership option
- **THEN** the panel SHALL show pending join requests

### Requirement: FilePickerModal component
The web SHALL provide a `FilePickerModal` component for selecting and uploading files in chat.

#### Scenario: File picker opens and uploads
- **WHEN** the user clicks "Attach file" in a message input
- **THEN** a modal SHALL open with file type selection (image, document, etc.)
- **WHEN** the user selects a file and confirms
- **THEN** the file SHALL be uploaded via the shared FilesService
- **THEN** the uploaded file URL SHALL be attached to the message

### Requirement: ConfirmModal component
The web SHALL provide a `ConfirmModal` component as the web counterpart to mobile's `Alert.alert()`.

#### Scenario: Confirm modal renders with actions
- **WHEN** `<ConfirmModal visible={true} title="Delete" message="Sure?" onConfirm={fn} onCancel={fn} />` is rendered
- **THEN** it SHALL show the title and message
- **THEN** it SHALL show "Confirmar" and "Cancelar" buttons
- **WHEN** the user clicks "Confirmar"
- **THEN** `onConfirm` SHALL be called
- **WHEN** the user clicks "Cancelar" or the overlay
- **THEN** `onCancel` SHALL be called
