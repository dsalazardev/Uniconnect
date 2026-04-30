# Specification: Notification Idempotency

## ADDED Requirements

### Requirement: Eliminate EventEmitter redundancy from acceptJoinRequest

The `acceptJoinRequest()` method in `GroupsService` SHALL remove the redundant `eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)` call. Notifications SHALL be created exclusively through the Observer pattern via `studyGroupSubject.notify()`.

#### Scenario: EventEmitter emit is removed from acceptJoinRequest
- **WHEN** `acceptJoinRequest()` is called
- **THEN** only `studyGroupSubject.notify()` is called; `eventEmitter.emit()` is not called

#### Scenario: PersistenceNotificationObserver handles all notifications
- **WHEN** `acceptJoinRequest()` completes successfully
- **THEN** exactly one notification is created via `PersistenceNotificationObserver` (not two via EventEmitter + Observer)

### Requirement: Remove redundant EventEmitter listener

The `handleGroupJoinRequestAccepted()` method in `NotificationEventListener` SHALL be removed. This listener becomes dead code once EventEmitter is removed from `acceptJoinRequest()`.

#### Scenario: NotificationEventListener no longer listens to GROUP_JOIN_REQUEST_ACCEPTED
- **WHEN** the `NotificationEventListener` is analyzed
- **THEN** no `@OnEvent(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)` handler exists

#### Scenario: No duplicate listeners for same event
- **WHEN** the notification system is audited
- **THEN** only `PersistenceNotificationObserver` listens to group join request events (not both EventEmitter and Observer)

### Requirement: Idempotent notification creation with 5-second collision detection

The system SHALL provide a method `createNotificationIdempotent()` in `NotificationsService` that prevents duplicate notifications for the same user and entity within a 5-second time window. The collision key SHALL be `[userId + related_entity_id]`, ignoring `notification_type` variations.

#### Scenario: First notification creation succeeds
- **WHEN** `createNotificationIdempotent()` is called with userId=1, related_entity_id=100, notification_type='group_join_request_accepted'
- **THEN** a new notification record is created in the database and returned

#### Scenario: Duplicate within 5-second window is prevented
- **WHEN** `createNotificationIdempotent()` is called twice with userId=1, related_entity_id=100 within 5 seconds (different notification_type values)
- **THEN** the first call creates a record, the second call returns the existing record without creating a duplicate

#### Scenario: Duplicate after 5-second window is allowed
- **WHEN** `createNotificationIdempotent()` is called with userId=1, related_entity_id=100, then called again after 5+ seconds with same parameters
- **THEN** both calls create separate notification records (window has expired)

#### Scenario: Different entities create separate notifications
- **WHEN** `createNotificationIdempotent()` is called with userId=1, related_entity_id=100, then called with userId=1, related_entity_id=200 within 5 seconds
- **THEN** both calls create separate notification records (different entities)

#### Scenario: Different users create separate notifications
- **WHEN** `createNotificationIdempotent()` is called with userId=1, related_entity_id=100, then called with userId=2, related_entity_id=100 within 5 seconds
- **THEN** both calls create separate notification records (different users)

### Requirement: Strict TypeScript typing for idempotent method

The `createNotificationIdempotent()` method SHALL use strict TypeScript typing with no `any` types. All parameters and return types SHALL be explicitly defined.

#### Scenario: Method signature has strict types
- **WHEN** the `createNotificationIdempotent()` method is defined
- **THEN** all parameters (id_user: number, message: string, notification_type: string, related_entity_id: number) and return type (Promise<Notification>) are explicitly typed

#### Scenario: No implicit any types in implementation
- **WHEN** the method implementation is analyzed
- **THEN** no implicit `any` types are used; all variables and function calls have explicit types

### Requirement: Defensive programming with error handling

The `createNotificationIdempotent()` method SHALL include try/catch error handling and logging for production debugging.

#### Scenario: Database errors are caught and logged
- **WHEN** a database error occurs during duplicate check or creation
- **THEN** the error is caught, logged with diagnostic information, and re-thrown with context

#### Scenario: Duplicate prevention is logged
- **WHEN** a duplicate notification is detected and prevented
- **THEN** a warning log is written with userId, related_entity_id, and notification_type for debugging

### Requirement: Database index for query performance

The system SHALL create a composite index on the notification table with columns `(id_user, created_at, notification_type)` to optimize duplicate detection queries.

#### Scenario: Index is created via migration
- **WHEN** the database migration is applied
- **THEN** a composite index on (id_user, created_at, notification_type) is created successfully

#### Scenario: Duplicate detection query uses index
- **WHEN** `createNotificationIdempotent()` executes the duplicate check query
- **THEN** the query uses the composite index for efficient range scanning (O(log n) performance)

### Requirement: PersistenceNotificationObserver uses idempotent method

The `PersistenceNotificationObserver` SHALL be updated to use `createNotificationIdempotent()` instead of direct `prisma.notification.create()` calls. This is the single notification creation mechanism.

#### Scenario: Observer uses idempotent method
- **WHEN** the `PersistenceNotificationObserver.update()` method is called
- **THEN** it calls `notificationsService.createNotificationIdempotent()` instead of `prisma.notification.create()`

#### Scenario: Single notification mechanism
- **WHEN** `acceptJoinRequest()` completes
- **THEN** exactly one notification is created via `PersistenceNotificationObserver` using idempotent method (not two via EventEmitter + Observer)

### Requirement: Comprehensive unit tests with property-based testing

The system SHALL include unit tests for idempotency logic using property-based testing with fast-check.

#### Scenario: Property-based test for idempotency
- **WHEN** property-based tests generate random userId, related_entity_id, and notification_type values
- **THEN** all generated test cases verify that duplicate calls within 5 seconds return the same record

#### Scenario: Property-based test for preservation
- **WHEN** property-based tests generate random userId, related_entity_id values with different notification_type values
- **THEN** all generated test cases verify that non-duplicate calls create separate records

#### Scenario: Unit tests cover edge cases
- **WHEN** unit tests are executed
- **THEN** all edge cases pass: boundary of 5-second window, concurrent requests, database errors, null values

### Requirement: Zero-Any policy compliance

All code changes SHALL maintain 100% strict TypeScript typing with zero `any` types, as required by AGENTS.md.

#### Scenario: TypeScript compilation succeeds with strict mode
- **WHEN** the code is compiled with `tsconfig.json` strict mode enabled
- **THEN** compilation succeeds with zero type errors and zero implicit `any` warnings

#### Scenario: Code review confirms no any types
- **WHEN** the implementation is reviewed
- **THEN** no `any` types are found in the implementation, tests, or type definitions
