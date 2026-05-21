## ADDED Requirements

### Requirement: Tapping a notification shall navigate to the relevant screen
The system SHALL navigate to the appropriate route when a user presses a notification item, based on its `notification_type`.

#### Scenario: Group invitation notification
- **WHEN** user taps a notification with `notification_type === 'GROUP_INVITATION'` and `related_entity_id` is present
- **THEN** the app navigates to `/groups/{related_entity_id}`

#### Scenario: Event reminder notification
- **WHEN** user taps a notification with `notification_type === 'EVENT_REMINDER'` and `related_entity_id` is present
- **THEN** the app navigates to `/events/{related_entity_id}`

#### Scenario: Direct message notification
- **WHEN** user taps a notification with `notification_type === 'MESSAGE'` and `related_entity_id` is present
- **THEN** the app navigates to `/chat/{related_entity_id}`

#### Scenario: Unknown notification type
- **WHEN** user taps a notification with an unsupported `notification_type`
- **THEN** the notification is marked as read
- **AND** no navigation occurs
