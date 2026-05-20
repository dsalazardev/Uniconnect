## ADDED Requirements

### Requirement: Reusable Button component
The web SHALL provide a reusable `Button` component in `src/components/elements/Button.tsx` matching mobile's Button primitive.

#### Scenario: Button renders with variants
- **WHEN** a `<Button variant="primary" />` is rendered
- **THEN** it SHALL render a styled `<button>` element with primary (blue) styling
- **WHEN** a `<Button variant="secondary" />` is rendered
- **THEN** it SHALL render with secondary (outline/gray) styling
- **WHEN** a `<Button variant="danger" />` is rendered
- **THEN** it SHALL render with danger (red) styling

#### Scenario: Button supports loading state
- **WHEN** a `<Button loading />` is rendered
- **THEN** it SHALL show a spinner or "Cargando..." text
- **THEN** the button SHALL be disabled

#### Scenario: Button supports disabled state
- **WHEN** a `<Button disabled />` is rendered
- **THEN** the button SHALL have `disabled` attribute
- **THEN** `onClick` SHALL NOT fire

### Requirement: Reusable Input component
The web SHALL provide a reusable `Input` component in `src/components/elements/Input.tsx`.

#### Scenario: Input renders with label and error
- **WHEN** `<Input label="Email" error="Required" />` is rendered
- **THEN** it SHALL render a `<label>` with text "Email"
- **THEN** it SHALL render an `<input>` element
- **THEN** it SHALL render the error message below the input
- **THEN** the input SHALL have an error CSS class

### Requirement: Reusable Modal component
The web SHALL provide a reusable `Modal` component in `src/components/elements/Modal.tsx`.

#### Scenario: Modal renders with overlay
- **WHEN** `<Modal visible={true} onClose={fn}>content</Modal>` is rendered
- **THEN** it SHALL render a semi-transparent overlay
- **THEN** it SHALL render a centered modal container with the children content
- **WHEN** the overlay is clicked
- **THEN** `onClose` SHALL be called

#### Scenario: Modal is hidden when not visible
- **WHEN** `<Modal visible={false}>content</Modal>` is rendered
- **THEN** nothing SHALL be rendered (return null)
