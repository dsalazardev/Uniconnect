## ADDED Requirements

### Requirement: Group owner shall see admin panel in group detail
The system SHALL render the GroupAdminPanel component inside GroupDetail when the current user is the group owner and the group is not a direct message.

#### Scenario: Owner views their group
- **WHEN** an owner navigates to `/groups/:id`
- **THEN** the GroupDetail page shows the GroupAdminPanel
- **AND** the panel displays pending join requests
- **AND** the panel displays current members with management actions

#### Scenario: Member views a group
- **WHEN** a non-owner member navigates to `/groups/:id`
- **THEN** the GroupAdminPanel is NOT rendered
- **AND** the member sees the normal group detail without admin controls

#### Scenario: Direct message chat does not show admin panel
- **WHEN** a user navigates to `/chat/:id` (a direct message)
- **THEN** the GroupAdminPanel is NOT rendered
- **AND** no member management UI is shown
