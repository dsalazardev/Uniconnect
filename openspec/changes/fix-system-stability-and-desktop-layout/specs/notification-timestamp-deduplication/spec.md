## ADDED Requirements

### Requirement: Track last update timestamp

The system SHALL track the timestamp of the last notification count update.

#### Scenario: Initial load
- **WHEN** app initializes and loads notification count
- **THEN** `lastUpdated` timestamp is set to current time (milliseconds)
- **THEN** `unreadCount` is set to API response value

#### Scenario: Subsequent update
- **WHEN** notification count is updated again
- **THEN** `lastUpdated` timestamp is updated to current time
- **THEN** `unreadCount` is updated to new value

### Requirement: Ignore stale updates

The system SHALL ignore notification count updates with older timestamps.

#### Scenario: Newer update arrives first
- **WHEN** update with timestamp T1 is processed
- **THEN** update with timestamp T0 (where T0 < T1) is ignored
- **THEN** `unreadCount` remains at value from T1

#### Scenario: Updates arrive in order
- **WHEN** update with timestamp T0 is processed
- **THEN** update with timestamp T1 (where T1 > T0) is accepted
- **THEN** `unreadCount` is updated to value from T1

#### Scenario: Simultaneous updates
- **WHEN** two updates have same timestamp (within 1ms)
- **THEN** last update wins
- **THEN** no error is thrown

### Requirement: Prevent race conditions between WebSocket and REST

The system SHALL handle concurrent updates from WebSocket and REST API.

#### Scenario: WebSocket update arrives first
- **WHEN** WebSocket emits count update at T0
- **THEN** REST API response arrives at T1 (where T1 > T0)
- **THEN** REST API value is used (newer timestamp)

#### Scenario: REST update arrives first
- **WHEN** REST API response arrives at T0
- **THEN** WebSocket emits count update at T1 (where T1 > T0)
- **THEN** WebSocket value is used (newer timestamp)

#### Scenario: Rapid successive updates
- **WHEN** 5 updates arrive within 100ms
- **THEN** only the last update (highest timestamp) is applied
- **THEN** intermediate values are ignored

### Requirement: Maintain timestamp across store updates

The system SHALL preserve timestamp when updating count via different methods.

#### Scenario: Update via fetchUnreadCount
- **WHEN** `fetchUnreadCount()` is called
- **THEN** timestamp is set to current time before API call
- **THEN** count is only updated if timestamp is newer than `lastUpdated`

#### Scenario: Update via decreaseUnread
- **WHEN** `decreaseUnread()` is called (optimistic update)
- **THEN** timestamp is set to current time
- **THEN** count is decremented by 1

#### Scenario: Update via resetUnread
- **WHEN** `resetUnread()` is called
- **THEN** timestamp is set to current time
- **THEN** count is set to 0
