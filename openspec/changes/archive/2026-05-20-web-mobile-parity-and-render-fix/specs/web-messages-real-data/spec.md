## ADDED Requirements

### Requirement: MessagesPage loads conversations from API

The `MessagesPage` SHALL load real conversation data from the backend instead of displaying a hardcoded empty array.

#### Scenario: MessagesPage fetches conversations on mount
- **WHEN** the user navigates to `/messages`
- **THEN** the page SHALL call `messagesService.getRecentMessages()` with the user's group memberships to populate the conversation list

#### Scenario: Loading state shown while fetching
- **WHEN** messages are being fetched from the API
- **THEN** the page SHALL display a loading indicator

#### Scenario: Error state shown on fetch failure
- **WHEN** the messages API call fails
- **THEN** the page SHALL display an error message with a retry option

### Requirement: MessagesPage shows user's message groups

The MessagesPage SHALL display the authenticated user's message groups (groups they are a member of), showing the group name and latest message preview for each.

#### Scenario: Groups loaded and displayed as conversation list
- **WHEN** messages are successfully loaded
- **THEN** the page SHALL display a list of groups with recent message previews

#### Scenario: Empty state for users with no groups
- **WHEN** the user has no groups with messages
- **THEN** the page SHALL display "No hay conversaciones" with guidance to join a group

### Requirement: Conversation item navigates to group detail

Each conversation item SHALL be clickable and navigate to the corresponding group detail page.

#### Scenario: Clicking a conversation opens the group
- **WHEN** the user clicks on a conversation item
- **THEN** the browser navigates to `/groups/{groupId}`
