# Specification: Study Group Lifecycle Events

## ADDED Requirements

### Requirement: Group Creation Event Emission
The system SHALL emit a `GROUP_CREATED` event when a study group is successfully created.

#### Scenario: Successful group creation
- **WHEN** a user creates a new study group
- **THEN** the system SHALL emit `GROUP_CREATED` event after the database transaction completes
- **AND** the event payload SHALL include `id_group`, `group_name`, `owner_id`, `owner_name`, `id_course`, `course_name`, and `created_at`

#### Scenario: Group creation fails
- **WHEN** group creation fails due to validation error or database error
- **THEN** the system SHALL NOT emit `GROUP_CREATED` event
- **AND** the system SHALL throw appropriate exception

#### Scenario: Event payload contains complete information
- **WHEN** `GROUP_CREATED` event is emitted
- **THEN** the payload SHALL include all necessary data for notification creation
- **AND** the payload SHALL be strictly typed with `GroupCreatedPayload` interface

### Requirement: Group Update Event Emission
The system SHALL emit a `GROUP_UPDATED` event when a study group is successfully updated.

#### Scenario: Successful group update
- **WHEN** a group owner updates group name or description
- **THEN** the system SHALL emit `GROUP_UPDATED` event after the database update completes
- **AND** the event payload SHALL include `id_group`, `group_name`, `owner_id`, `updated_fields`, and `updated_at`

#### Scenario: Group update fails
- **WHEN** group update fails due to permission error or database error
- **THEN** the system SHALL NOT emit `GROUP_UPDATED` event
- **AND** the system SHALL throw appropriate exception

#### Scenario: Updated fields tracking
- **WHEN** `GROUP_UPDATED` event is emitted
- **THEN** the payload SHALL include `updated_fields` array with names of changed fields
- **AND** the array SHALL contain only fields that were actually modified

### Requirement: Group Deletion Event Emission
The system SHALL emit a `GROUP_DELETED` event when a study group is successfully deleted.

#### Scenario: Successful group deletion
- **WHEN** a group owner deletes a study group
- **THEN** the system SHALL emit `GROUP_DELETED` event after the database deletion completes
- **AND** the event payload SHALL include `id_group`, `group_name`, `owner_id`, and `deleted_at`

#### Scenario: Group deletion fails
- **WHEN** group deletion fails due to permission error or database error
- **THEN** the system SHALL NOT emit `GROUP_DELETED` event
- **AND** the system SHALL throw appropriate exception

#### Scenario: Deletion of non-existent group
- **WHEN** attempting to delete a group that does not exist
- **THEN** the system SHALL throw NotFoundException
- **AND** the system SHALL NOT emit `GROUP_DELETED` event

### Requirement: User Left Group Event Emission
The system SHALL emit a `USER_LEFT_GROUP` event when a user successfully leaves a study group.

#### Scenario: User voluntarily leaves group
- **WHEN** a user leaves a study group
- **THEN** the system SHALL emit `USER_LEFT_GROUP` event after membership deletion completes
- **AND** the event payload SHALL include `id_user`, `user_name`, `id_group`, `group_name`, and `left_at`

#### Scenario: User leave fails
- **WHEN** user leave fails due to validation error (e.g., owner cannot leave)
- **THEN** the system SHALL NOT emit `USER_LEFT_GROUP` event
- **AND** the system SHALL throw appropriate exception

#### Scenario: Non-member attempts to leave
- **WHEN** a user who is not a member attempts to leave a group
- **THEN** the system SHALL throw NotFoundException
- **AND** the system SHALL NOT emit `USER_LEFT_GROUP` event

### Requirement: Group Activity Listener
The system SHALL have a dedicated listener that reacts to group lifecycle events.

#### Scenario: Listener handles GROUP_CREATED event
- **WHEN** `GROUP_CREATED` event is emitted
- **THEN** the GroupActivityListener SHALL receive the event via `@OnEvent()` decorator
- **AND** the listener SHALL create a notification for the group owner

#### Scenario: Listener handles GROUP_UPDATED event
- **WHEN** `GROUP_UPDATED` event is emitted
- **THEN** the GroupActivityListener SHALL receive the event
- **AND** the listener SHALL create notifications for all group members except the owner

#### Scenario: Listener handles GROUP_DELETED event
- **WHEN** `GROUP_DELETED` event is emitted
- **THEN** the GroupActivityListener SHALL receive the event
- **AND** the listener SHALL create notifications for all former group members

#### Scenario: Listener handles USER_LEFT_GROUP event
- **WHEN** `USER_LEFT_GROUP` event is emitted
- **THEN** the GroupActivityListener SHALL receive the event
- **AND** the listener SHALL create notifications for remaining group members

#### Scenario: Listener error does not affect main operation
- **WHEN** the listener encounters an error while processing an event
- **THEN** the error SHALL be logged but not propagated
- **AND** the main operation (create/update/delete/leave) SHALL complete successfully

### Requirement: Notification Creation for Group Events
The system SHALL create appropriate notifications in the database for each group lifecycle event.

#### Scenario: Notification for group creation
- **WHEN** a group is created
- **THEN** a notification SHALL be created for the owner
- **AND** the notification message SHALL be "Grupo '{name}' creado exitosamente"
- **AND** the notification type SHALL be 'group_created'

#### Scenario: Notification for group update
- **WHEN** a group is updated
- **THEN** notifications SHALL be created for all members except the owner
- **AND** the notification message SHALL be "El grupo '{name}' fue actualizado"
- **AND** the notification type SHALL be 'group_updated'

#### Scenario: Notification for group deletion
- **WHEN** a group is deleted
- **THEN** notifications SHALL be created for all former members
- **AND** the notification message SHALL be "El grupo '{name}' fue eliminado"
- **AND** the notification type SHALL be 'group_deleted'

#### Scenario: Notification for user leaving group
- **WHEN** a user leaves a group
- **THEN** notifications SHALL be created for remaining members
- **AND** the notification message SHALL be "{user} salió del grupo '{name}'"
- **AND** the notification type SHALL be 'user_left_group'

#### Scenario: Batch notification creation
- **WHEN** multiple notifications need to be created for the same event
- **THEN** the system SHALL use `createMany()` for efficient batch insertion
- **AND** all notifications SHALL have `is_read: false` and current timestamp

### Requirement: Event Payload Type Safety
All group lifecycle events SHALL use strictly typed payload interfaces with zero `any` types.

#### Scenario: GroupCreatedPayload type enforcement
- **WHEN** emitting `GROUP_CREATED` event
- **THEN** the payload SHALL conform to `GroupCreatedPayload` interface
- **AND** TypeScript SHALL enforce type checking at compile time

#### Scenario: GroupUpdatedPayload type enforcement
- **WHEN** emitting `GROUP_UPDATED` event
- **THEN** the payload SHALL conform to `GroupUpdatedPayload` interface
- **AND** the `updated_fields` SHALL be typed as `string[]`

#### Scenario: GroupDeletedPayload type enforcement
- **WHEN** emitting `GROUP_DELETED` event
- **THEN** the payload SHALL conform to `GroupDeletedPayload` interface
- **AND** all fields SHALL be non-nullable

#### Scenario: UserLeftGroupPayload type enforcement
- **WHEN** emitting `USER_LEFT_GROUP` event
- **THEN** the payload SHALL conform to `UserLeftGroupPayload` interface
- **AND** all fields SHALL be non-nullable

### Requirement: Observer Pattern Implementation
The system SHALL implement the Observer pattern using EventEmitter2 for group lifecycle events.

#### Scenario: GroupsService acts as Subject
- **WHEN** a group lifecycle operation occurs
- **THEN** GroupsService SHALL emit the corresponding event
- **AND** the service SHALL not know about specific listeners

#### Scenario: GroupActivityListener acts as Observer
- **WHEN** a group lifecycle event is emitted
- **THEN** GroupActivityListener SHALL automatically receive the event
- **AND** the listener SHALL react by creating notifications

#### Scenario: Multiple observers can subscribe
- **WHEN** a group lifecycle event is emitted
- **THEN** all registered listeners with `@OnEvent()` SHALL receive the event
- **AND** each listener SHALL process the event independently

#### Scenario: Event emission is non-blocking
- **WHEN** an event is emitted
- **THEN** the emitting method SHALL not wait for listeners to complete
- **AND** the main operation SHALL return immediately after emission
