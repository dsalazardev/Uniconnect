# Specification: Real-Time Message Observation

## ADDED Requirements

### Requirement: Message Read Notification
The system SHALL notify all connected users in a group when a message is read by any user.

#### Scenario: User reads a message
- **WHEN** a user reads a message in a group chat
- **THEN** the system SHALL emit a `message:read` event to all users in the group room
- **AND** the event payload SHALL include `id_message`, `id_user`, and `read_at` timestamp

#### Scenario: Multiple users read the same message
- **WHEN** multiple users read the same message
- **THEN** the system SHALL emit separate `message:read` events for each user
- **AND** each event SHALL contain the respective user's ID and read timestamp

#### Scenario: User not authenticated
- **WHEN** a non-authenticated user attempts to send a message read event
- **THEN** the system SHALL return an error response
- **AND** the error message SHALL indicate "Usuario no autenticado"

### Requirement: User Presence Broadcasting
The system SHALL broadcast user presence status (online/offline/away) to all users in the same group.

#### Scenario: User comes online
- **WHEN** a user connects and authenticates to a group
- **THEN** the system SHALL emit a `user:presence` event to all users in the group
- **AND** the event payload SHALL include `id_user`, `status: 'online'`, and optional `last_seen` timestamp

#### Scenario: User goes offline
- **WHEN** a user disconnects from a group
- **THEN** the system SHALL emit a `user:presence` event with `status: 'offline'`
- **AND** the system SHALL update the user's `last_seen` timestamp

#### Scenario: User changes status to away
- **WHEN** a user explicitly sets their status to 'away'
- **THEN** the system SHALL emit a `user:presence` event with `status: 'away'`
- **AND** the system SHALL broadcast the change to all users in the group

#### Scenario: Presence status throttling
- **WHEN** a user's presence status changes multiple times within 5 seconds
- **THEN** the system SHALL throttle emissions to a maximum of one event per 5 seconds
- **AND** the system SHALL emit the most recent status change after the throttle period

### Requirement: Group Activity Notifications
The system SHALL notify users of significant group activities (member joins, member leaves, group updates).

#### Scenario: New member joins group
- **WHEN** a new member joins a group
- **THEN** the system SHALL emit a `group:activity` event to all users in the group
- **AND** the event payload SHALL include `activity_type: 'member_joined'`, `actor_id`, `actor_name`, and `timestamp`

#### Scenario: Member leaves group
- **WHEN** a member leaves a group
- **THEN** the system SHALL emit a `group:activity` event with `activity_type: 'member_left'`
- **AND** the event SHALL include the departing member's ID and name

#### Scenario: Group metadata updated
- **WHEN** a group's name or description is updated
- **THEN** the system SHALL emit a `group:activity` event with `activity_type: 'group_updated'`
- **AND** the event SHALL include the ID of the user who made the update

#### Scenario: Activity notification to non-members
- **WHEN** a group activity event is emitted
- **THEN** the system SHALL only broadcast to users who are currently members of the group
- **AND** the system SHALL NOT send notifications to users who have left the group

### Requirement: Observer Pattern Implementation
The system SHALL implement the Observer pattern using WebSocket subscriptions where the MessagesGateway acts as the Subject and connected clients act as Observers.

#### Scenario: Client subscribes to events
- **WHEN** a client connects and authenticates to a group
- **THEN** the client SHALL automatically subscribe to all observable events for that group
- **AND** the client SHALL receive notifications for `message:read`, `user:presence`, and `group:activity` events

#### Scenario: Client unsubscribes from events
- **WHEN** a client leaves a group room
- **THEN** the system SHALL automatically unsubscribe the client from all group events
- **AND** the client SHALL no longer receive notifications for that group

#### Scenario: Multiple observers receive same event
- **WHEN** an observable event occurs in a group
- **THEN** all connected clients in that group SHALL receive the event simultaneously
- **AND** each client SHALL receive an identical event payload

### Requirement: ChatSessionManager Presence Tracking
The ChatSessionManager singleton SHALL track and manage user presence states in memory.

#### Scenario: Set user presence
- **WHEN** a user's presence status changes
- **THEN** the ChatSessionManager SHALL update the user's presence state in memory
- **AND** the state SHALL be retrievable via `getUserPresence(userId)`

#### Scenario: Get group presences
- **WHEN** requesting all presences for a group
- **THEN** the ChatSessionManager SHALL return a Map of user IDs to presence statuses
- **AND** the Map SHALL only include users currently in the group

#### Scenario: Presence state on disconnect
- **WHEN** a user disconnects
- **THEN** the ChatSessionManager SHALL set their presence to 'offline'
- **AND** the ChatSessionManager SHALL record the `last_seen` timestamp

#### Scenario: Presence state persistence
- **WHEN** the server restarts
- **THEN** all presence states SHALL be lost (in-memory only)
- **AND** clients SHALL re-establish their presence upon reconnection
