## ADDED Requirements

### Requirement: Maestro is installed and configured in Frontend-mobile
The Frontend-mobile project SHALL have Maestro installed as a devDependency and configured with a `.maestro/config.yaml` file for test execution.

#### Scenario: Maestro CLI is available after installation
- **WHEN** `maestro --version` is executed in the Frontend-mobile directory
- **THEN** it returns a valid version number without errors

#### Scenario: Maestro config file exists
- **WHEN** the file `.maestro/config.yaml` is inspected
- **THEN** it contains valid Maestro configuration (appId, test base directory, output format)

### Requirement: Maestro login flow exists
The system SHALL have a reusable Maestro subflow that performs login authentication (email + password or Google OAuth mock) consumable by other flows.

#### Scenario: Login flow completes successfully
- **WHEN** the login subflow is executed with valid credentials
- **THEN** the user is authenticated and the main screen is displayed

### Requirement: E2E test flow for study session creation
The system SHALL have a Maestro flow that creates a study session from the mobile app, including: login → navigate to group → create session with title, date, duration → verify session appears in group.

#### Scenario: Study session creation flow completes
- **WHEN** the study-session Maestro flow is executed
- **THEN** the session is created and visible in the group's session list

#### Scenario: Weekly recurrence is selectable
- **WHEN** the user selects "WEEKLY" recurrence during session creation and sets an end date
- **THEN** multiple instances are created and displayed

### Requirement: E2E test validates WebSocket synchronization with web calendar
The E2E test SHALL verify that a study session created from the mobile app appears in the web calendar (via WebSocket push, without manual refresh). This MAY be validated through API polling against `GET /groups/:groupId/study-sessions` after creation, rather than requiring a browser-based verification step in Maestro.

#### Scenario: Session created in mobile is visible via API
- **WHEN** a study session is created via the Maestro mobile flow
- **THEN** an HTTP GET to `/groups/:groupId/study-sessions` returns the new session in the response list

#### Scenario: WebSocket event is broadcast on session creation
- **WHEN** a study session is created
- **THEN** a WebSocket event (e.g., `study_session:created`) is emitted to the group room with the session data

### Requirement: Failed E2E tests produce screenshots and video
Maestro SHALL be configured to capture screenshots and record video on test failure, stored in `~/.maestro/output/`.

#### Scenario: Artifacts are generated on failure
- **WHEN** a Maestro flow fails
- **THEN** screenshots and a video recording of the failed flow are available in the output directory
