## ADDED Requirements

### Requirement: Listen for mention WebSocket events
The useChat hook SHALL handle the `message:mention` WebSocket event and create a notification when the current user is mentioned.

#### Scenario: Receive mention event for current user
- **WHEN** the WebSocket receives a `message:mention` event where `mentioned_user_id` equals the current user's ID
- **THEN** the system SHALL create a notification in `notificationsStore` with type `mention`
- **THEN** the system SHALL display a toast notification saying `"{sender_name} te mencionó en un mensaje"`

#### Scenario: Receive mention event for different user
- **WHEN** the WebSocket receives a `message:mention` event where `mentioned_user_id` is NOT the current user
- **THEN** the system SHALL ignore the event and NOT create any notification

#### Scenario: No WebSocket connection
- **WHEN** there is no active WebSocket connection
- **THEN** the system SHALL NOT throw errors — degraded gracefully

### Requirement: Navigate to chat on notification click
The mention notification SHALL navigate the user to the specific group chat where the mention occurred.

#### Scenario: Click notification toast navigates to chat
- **WHEN** the user clicks the mention toast notification
- **THEN** the system SHALL navigate to `/messages/groups/{id_group}`
- **THEN** the `notificationsStore` SHALL mark the notification as read

#### Scenario: Click notification in NotificationCenter navigates to chat
- **WHEN** the user clicks the mention notification in the NotificationCenter list
- **THEN** the system SHALL navigate to `/messages/groups/{id_group}`

### Requirement: Toast with action button
The mention toast SHALL include an action button to navigate directly.

#### Scenario: Toast displays with action
- **WHEN** a mention notification toast is shown
- **THEN** the toast SHALL display the message `"{sender_name} te mencionó"`
- **THEN** the toast SHALL include an "Ir al chat" button
- **WHEN** the user clicks "Ir al chat"
- **THEN** the system SHALL navigate to `/messages/groups/{id_group}`
