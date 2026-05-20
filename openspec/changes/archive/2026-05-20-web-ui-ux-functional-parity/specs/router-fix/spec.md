## ADDED Requirements

### Requirement: Events route renders EventsPage with data
The system SHALL render `<EventsPage />` instead of `<EventList />` at the `/events` route so that events are fetched from the API and displayed.

#### Scenario: Router directs /events to EventsPage
- **WHEN** user navigates to `/events`
- **THEN** the router renders `<EventsPage />` which calls `useEvents()` and passes fetched events to `<EventList />`

#### Scenario: EventsPage fetches events on mount
- **WHEN** the EventsPage mounts and `eventsStore.events.length === 0`
- **THEN** `eventsStore.loadEvents()` is called and events appear in the list

### Requirement: Groups route renders GroupsPage wrapper
The system SHALL render a `GroupsPage` wrapper at `/groups` that uses the `useGroups` hook and passes data to `<GroupList />`.

#### Scenario: Router directs /groups to GroupsPage
- **WHEN** user navigates to `/groups`
- **THEN** the router renders `<GroupsPage />` which calls `useGroups()` and passes `groups`, `onGroupPress`, `onEdit`, `onDelete` props to `<GroupList />`

#### Scenario: GroupsPage shows loading state
- **WHEN** the router navigates to `/groups` and data is still loading
- **THEN** the system SHALL display a loading spinner

### Requirement: Messages route renders MessagesPage wrapper
The system SHALL render a `MessagesPage` wrapper at `/messages` that provides `messages` and `currentUserId` to `<MessageList />`.

#### Scenario: Router directs /messages to MessagesPage
- **WHEN** user navigates to `/messages`
- **THEN** the router renders `<MessagesPage />` with the message list and current user context

#### Scenario: MessagesPage shows loading state
- **WHEN** the router navigates to `/messages` and conversations are loading
- **THEN** the system SHALL display a loading spinner
