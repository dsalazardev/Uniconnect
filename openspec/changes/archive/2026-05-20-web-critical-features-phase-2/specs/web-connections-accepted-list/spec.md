## ADDED Requirements

### Requirement: Web shall display accepted connections (friends list)
The system SHALL display a list of the user's accepted connections in the Connections section of the web app.

#### Scenario: User views accepted connections
- **WHEN** an authenticated user navigates to the connections area
- **THEN** a list of accepted connections (friends) is displayed
- **AND** each entry shows the friend's name, picture, and program

#### Scenario: Empty friends list
- **WHEN** a user has no accepted connections
- **THEN** an empty state message is shown (e.g., "No tienes amigos aún")

#### Scenario: Friend list coexists with pending requests
- **WHEN** the connections page loads
- **THEN** both pending requests AND accepted friends are visible
- **AND** pending requests appear in a separate section from accepted friends
