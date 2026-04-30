## Why

The Uniconnect backend has **redundant notification mechanisms** causing duplicate records (IDs 287, 288) and architectural confusion. The `acceptJoinRequest()` method in `GroupsService` emits notifications through **two independent channels**:
1. **EventEmitter pattern** (`eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)`) → triggers `NotificationEventListener` → creates notifications via `prisma.notification.create()`
2. **Observer pattern** (`studyGroupSubject.notify()`) → triggers `PersistenceNotificationObserver` → creates notifications via `prisma.notification.create()`

This dual-channel approach causes duplicate records when both listeners fire simultaneously. The solution is to **consolidate to a single Observer pattern** and eliminate the redundant EventEmitter mechanism.

## What Changes

- **Eliminate EventEmitter redundancy**: Remove `eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)` from `acceptJoinRequest()` in `GroupsService`. Keep only `studyGroupSubject.notify()`.
- **Implement idempotent notification creation**: Add `createNotificationIdempotent()` method to `NotificationsService` with strict typing and 5-second collision detection using key `[userId + related_entity_id]`.
- **Update PersistenceNotificationObserver**: Modify to use `createNotificationIdempotent()` instead of direct `prisma.notification.create()` calls.
- **Add database index**: Create composite index on `(id_user, created_at, notification_type)` for query performance.
- **Remove redundant listener**: Delete the `handleGroupJoinRequestAccepted()` handler from `NotificationEventListener` that listens to the EventEmitter (no longer needed).

## Capabilities

### New Capabilities
- `notification-idempotency`: Idempotent notification creation with 5-second collision detection using userId + related_entity_id as collision key. Prevents duplicate notifications through single Observer pattern.

### Modified Capabilities
- `group-join-request-notification`: Changed from dual-channel (EventEmitter + Observer) to single-channel (Observer only). Eliminates redundancy and duplicate records.

## Impact

- **Backend Service**: `Backend/src/notifications/notifications.service.ts` - New method `createNotificationIdempotent()` with defensive programming and strict typing.
- **Backend Service**: `Backend/src/groups/groups.service.ts` - Remove redundant `eventEmitter.emit()` call from `acceptJoinRequest()` method. Keep only `studyGroupSubject.notify()`.
- **Backend Listener**: `Backend/src/notifications/listeners/notification-event.listener.ts` - Remove `handleGroupJoinRequestAccepted()` handler (no longer needed; Observer pattern handles it).
- **Backend Observer**: `Backend/src/notifications/listeners/notification-event.listener.ts` - Update `PersistenceNotificationObserver` to use idempotent method.
- **Database**: New composite index on notification table for performance.
- **Testing**: New unit tests for idempotency logic with property-based testing (fast-check).
- **No breaking changes**: Observer pattern preserved. Decorator patterns unchanged. Only redundant EventEmitter removed.
- **Zero-Any policy**: 100% strict TypeScript typing maintained throughout.
