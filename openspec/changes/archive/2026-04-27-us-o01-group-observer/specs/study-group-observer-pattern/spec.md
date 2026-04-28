# Specification: Study Group Observer Pattern

## ADDED Requirements

### Requirement: StudyGroupSubject implements ISubject interface
The system SHALL provide a `StudyGroupSubject` class that implements `ISubject<StudyGroupEvent>` and manages observer registration and notification for study group events.

#### Scenario: Subject implements ISubject contract
- **WHEN** `StudyGroupSubject` is instantiated
- **THEN** it MUST implement `attach(observer: IObserver<StudyGroupEvent>)` method
- **THEN** it MUST implement `detach(observer: IObserver<StudyGroupEvent>)` method
- **THEN** it MUST implement `notify(event: StudyGroupEvent)` method

#### Scenario: Observer attachment
- **WHEN** an observer is attached to the subject
- **THEN** the observer MUST be added to the internal observers list
- **THEN** duplicate attachments MUST be prevented

#### Scenario: Observer detachment
- **WHEN** an observer is detached from the subject
- **THEN** the observer MUST be removed from the internal observers list
- **THEN** detaching a non-attached observer MUST not throw an error

### Requirement: StudyGroupEvent type defines 5 event types
The system SHALL define a `StudyGroupEvent` interface with discriminated union type supporting 5 event types: `JOIN_REQUEST`, `MEMBER_ACCEPTED`, `MEMBER_REJECTED`, `ADMIN_TRANSFER_REQUESTED`, `ADMIN_TRANSFER_ACCEPTED`.

#### Scenario: Event type discrimination
- **WHEN** a `StudyGroupEvent` is created
- **THEN** it MUST have a `type` field with one of the 5 valid event types
- **THEN** it MUST have a `payload` field matching the event type
- **THEN** it MUST have a `targetUserId` field indicating the notification recipient
- **THEN** it MUST have a `timestamp` field with event creation time

#### Scenario: Type-safe payload matching
- **WHEN** event type is `JOIN_REQUEST`
- **THEN** payload MUST be `GroupJoinRequestSentPayload`

#### Scenario: Target user identification
- **WHEN** any event is created
- **THEN** `targetUserId` MUST be a positive integer
- **THEN** `targetUserId` MUST identify the user who should receive the notification

### Requirement: Subject notifies all attached observers
The system SHALL notify all attached observers when `notify()` is called with a `StudyGroupEvent`.

#### Scenario: Successful notification to multiple observers
- **WHEN** subject has 2 attached observers
- **WHEN** `subject.notify(event)` is called
- **THEN** both observers MUST receive `update(event)` call
- **THEN** notification order MUST match attachment order

#### Scenario: Observer notification failure isolation
- **WHEN** one observer throws an error during `update()`
- **THEN** other observers MUST still receive notifications
- **THEN** the error MUST be logged
- **THEN** `notify()` MUST not throw an error

#### Scenario: Notification with no observers
- **WHEN** subject has no attached observers
- **WHEN** `subject.notify(event)` is called
- **THEN** no errors MUST be thrown
- **THEN** operation MUST complete successfully

### Requirement: WebSocketNotificationObserver emits to user sockets
The system SHALL provide a `WebSocketNotificationObserver` that implements `IObserver<StudyGroupEvent>` and emits notifications to the target user's WebSocket connections.

#### Scenario: Observer implements IObserver contract
- **WHEN** `WebSocketNotificationObserver` is instantiated
- **THEN** it MUST implement `update(event: StudyGroupEvent)` method

#### Scenario: WebSocket emission to single socket
- **WHEN** observer receives an event
- **WHEN** target user has 1 active socket connection
- **THEN** observer MUST call `ChatSessionManager.getUserSockets(targetUserId)`
- **THEN** observer MUST emit `'study_group_notification'` event to that socket via `ChatGateway.server.to(socketId).emit()`

#### Scenario: WebSocket emission to multiple sockets
- **WHEN** observer receives an event
- **WHEN** target user has multiple active socket connections (multiple devices)
- **THEN** observer MUST emit notification to ALL user's sockets

#### Scenario: WebSocket emission when user offline
- **WHEN** observer receives an event
- **WHEN** target user has no active socket connections
- **THEN** observer MUST not throw an error
- **THEN** operation MUST complete silently (user will see notification in DB)

### Requirement: PersistenceNotificationObserver persists to database
The system SHALL provide a `PersistenceNotificationObserver` that implements `IObserver<StudyGroupEvent>` and persists notifications to the `notification` table.

#### Scenario: Observer implements IObserver contract
- **WHEN** `PersistenceNotificationObserver` is instantiated
- **THEN** it MUST implement `update(event: StudyGroupEvent)` method

#### Scenario: Notification persistence for JOIN_REQUEST
- **WHEN** observer receives a `JOIN_REQUEST` event
- **THEN** observer MUST create a notification record with:
  - `id_user` = `event.targetUserId`
  - `message` = human-readable Spanish text
  - `is_read` = `false`
  - `created_at` = current timestamp
  - `related_entity_id` = `event.payload.id_group`
  - `notification_type` = `'join_request'`

#### Scenario: Notification persistence for MEMBER_ACCEPTED
- **WHEN** observer receives a `MEMBER_ACCEPTED` event
- **THEN** observer MUST create a notification record with `notification_type` = `'member_accepted'`

#### Scenario: Notification persistence for MEMBER_REJECTED
- **WHEN** observer receives a `MEMBER_REJECTED` event
- **THEN** observer MUST create a notification record with `notification_type` = `'member_rejected'`

#### Scenario: Notification persistence for ADMIN_TRANSFER_REQUESTED
- **WHEN** observer receives an `ADMIN_TRANSFER_REQUESTED` event
- **THEN** observer MUST create a notification record with `notification_type` = `'admin_transfer_requested'`

#### Scenario: Notification persistence for ADMIN_TRANSFER_ACCEPTED
- **WHEN** observer receives an `ADMIN_TRANSFER_ACCEPTED` event
- **THEN** observer MUST create a notification record with `notification_type` = `'admin_transfer_accepted'`

#### Scenario: Database error handling
- **WHEN** Prisma fails to create notification
- **THEN** observer MUST log the error
- **THEN** observer MUST not throw an error (fire-and-forget pattern)

### Requirement: Observers registered at module initialization
The system SHALL register both observers with the subject when `GroupsModule` initializes.

#### Scenario: Module implements OnModuleInit
- **WHEN** `GroupsModule` is initialized
- **THEN** it MUST implement `OnModuleInit` interface
- **THEN** it MUST inject `StudyGroupSubject`, `WebSocketNotificationObserver`, and `PersistenceNotificationObserver`

#### Scenario: Observers attached during initialization
- **WHEN** `onModuleInit()` is called
- **THEN** `subject.attach(webSocketObserver)` MUST be called
- **THEN** `subject.attach(persistenceObserver)` MUST be called
- **THEN** both observers MUST be ready to receive notifications

### Requirement: GroupsService notifies subject on join request
The system SHALL call `subject.notify()` in `GroupsService.requestJoinGroup()` after successfully creating a join request.

#### Scenario: Notification on successful join request
- **WHEN** `requestJoinGroup()` successfully creates a join request
- **THEN** `subject.notify()` MUST be called with event type `JOIN_REQUEST`
- **THEN** `targetUserId` MUST be the group owner's ID
- **THEN** payload MUST include `id_request`, `id_group`, `group_name`, `requester_id`, `requester_name`

### Requirement: GroupsService notifies subject on request acceptance
The system SHALL call `subject.notify()` in `GroupsService.acceptJoinRequest()` after successfully accepting a join request.

#### Scenario: Notification on successful acceptance
- **WHEN** `acceptJoinRequest()` successfully accepts a join request
- **THEN** `subject.notify()` MUST be called with event type `MEMBER_ACCEPTED`
- **THEN** `targetUserId` MUST be the requester's ID
- **THEN** payload MUST include `id_request`, `id_group`, `group_name`, `requester_id`

### Requirement: GroupsService notifies subject on request rejection
The system SHALL call `subject.notify()` in `GroupsService.rejectJoinRequest()` after successfully rejecting a join request.

#### Scenario: Notification on successful rejection
- **WHEN** `rejectJoinRequest()` successfully rejects a join request
- **THEN** `subject.notify()` MUST be called with event type `MEMBER_REJECTED`
- **THEN** `targetUserId` MUST be the requester's ID
- **THEN** payload MUST include `id_request`, `id_group`, `group_name`, `requester_id`

### Requirement: GroupsService notifies subject on ownership transfer
The system SHALL call `subject.notify()` in `GroupsService.transferOwnership()` twice: once for the request and once for the acceptance.

#### Scenario: Notification on transfer request
- **WHEN** `transferOwnership()` is called
- **THEN** `subject.notify()` MUST be called with event type `ADMIN_TRANSFER_REQUESTED`
- **THEN** `targetUserId` MUST be the new owner's ID
- **THEN** payload MUST include `id_group`, `group_name`, `previous_owner_id`, `new_owner_id`

#### Scenario: Notification on transfer acceptance
- **WHEN** `transferOwnership()` successfully completes the transfer
- **THEN** `subject.notify()` MUST be called with event type `ADMIN_TRANSFER_ACCEPTED`
- **THEN** `targetUserId` MUST be the previous owner's ID
- **THEN** payload MUST include `id_group`, `group_name`, `previous_owner_id`, `new_owner_id`

### Requirement: MESSAGE_EVENTS extended with admin transfer events
The system SHALL add 2 new events to `MESSAGE_EVENTS` constant: `ADMIN_TRANSFER_REQUESTED` and `ADMIN_TRANSFER_ACCEPTED`.

#### Scenario: New events added to MESSAGE_EVENTS
- **WHEN** `MESSAGE_EVENTS` is imported
- **THEN** it MUST include `ADMIN_TRANSFER_REQUESTED: 'admin.transfer.requested'`
- **THEN** it MUST include `ADMIN_TRANSFER_ACCEPTED: 'admin.transfer.accepted'`

#### Scenario: Payload interfaces defined
- **WHEN** admin transfer events are used
- **THEN** `AdminTransferRequestedPayload` interface MUST exist with fields: `id_group`, `group_name`, `previous_owner_id`, `new_owner_id`, `requested_at`
- **THEN** `AdminTransferAcceptedPayload` interface MUST exist with fields: `id_group`, `group_name`, `previous_owner_id`, `new_owner_id`, `accepted_at`

### Requirement: UML diagram documents observer pattern
The system SHALL include a README.md in `src/groups/domain/observer/` with a Mermaid UML class diagram documenting the observer pattern structure.

#### Scenario: README exists with UML diagram
- **WHEN** the README.md is viewed
- **THEN** it MUST include a Mermaid class diagram
- **THEN** diagram MUST show `ISubject<T>` interface
- **THEN** diagram MUST show `IObserver<T>` interface
- **THEN** diagram MUST show `StudyGroupSubject` implementing `ISubject<StudyGroupEvent>`
- **THEN** diagram MUST show `WebSocketNotificationObserver` implementing `IObserver<StudyGroupEvent>`
- **THEN** diagram MUST show `PersistenceNotificationObserver` implementing `IObserver<StudyGroupEvent>`

#### Scenario: Diagram shows relationships
- **WHEN** the UML diagram is rendered
- **THEN** it MUST show composition relationship between `StudyGroupSubject` and `IObserver<StudyGroupEvent>`
- **THEN** it MUST show implementation relationships (implements arrows)
- **THEN** it MUST show the 5 event types in `StudyGroupEvent`

### Requirement: Observer pattern maintains Zero-Any policy
The system SHALL implement all observer classes with strict TypeScript typing and zero usage of `any` type.

#### Scenario: Type safety enforcement
- **WHEN** observer classes are implemented
- **THEN** all method signatures MUST use explicit types
- **THEN** no `any` type MUST be used in parameters, return types, or internal variables
- **THEN** event payloads MUST use discriminated unions for type safety

### Requirement: Observer pattern coexists with EventEmitter2
The system SHALL ensure the Observer pattern coexists with the existing EventEmitter2 pattern without conflicts.

#### Scenario: Both patterns operational
- **WHEN** a group event occurs
- **THEN** EventEmitter2 MAY emit global events (GroupActivityListener)
- **THEN** Observer pattern MUST emit targeted user notifications
- **THEN** both patterns MUST operate independently without interference

#### Scenario: No duplicate notifications
- **WHEN** a join request is accepted
- **THEN** EventEmitter2 MAY create notifications for all members
- **THEN** Observer pattern MUST create notification only for the requester
- **THEN** no duplicate notifications MUST be created for the same user
