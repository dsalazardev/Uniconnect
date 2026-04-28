# Proposal: US-O01 - Observer Pattern for Study Group Events

## Why

Study groups currently lack real-time notifications for critical events (join requests, member acceptance/rejection, admin transfers). Users must manually refresh to see updates, creating poor UX and missed notifications. Implementing the Observer pattern enables automatic, real-time notifications via WebSocket and persistent storage in the database.

## What Changes

- Create `StudyGroupSubject` in `src/groups/domain/observer/` implementing `ISubject<StudyGroupEvent>` from messages module
- Create `StudyGroupEvent` type with 5 event types: `JOIN_REQUEST`, `MEMBER_ACCEPTED`, `MEMBER_REJECTED`, `ADMIN_TRANSFER_REQUESTED`, `ADMIN_TRANSFER_ACCEPTED`
- Create `WebSocketNotificationObserver` in `src/groups/infrastructure/observers/` to emit real-time notifications via ChatGateway
- Create `PersistenceNotificationObserver` in `src/groups/infrastructure/observers/` to persist notifications in database
- Add 2 new events to `MESSAGE_EVENTS`: `ADMIN_TRANSFER_REQUESTED`, `ADMIN_TRANSFER_ACCEPTED` with typed payloads
- Modify `GroupsModule` to implement `OnModuleInit` and attach observers to subject
- Inject `subject.notify()` calls in 4 GroupsService methods: `requestJoinGroup()`, `acceptJoinRequest()`, `rejectJoinRequest()`, `transferOwnership()`
- Create UML diagram in `src/groups/domain/observer/README.md` documenting the pattern

## Capabilities

### New Capabilities
- `study-group-observer-pattern`: Observer pattern implementation for study group events with real-time WebSocket notifications and database persistence

### Modified Capabilities
<!-- No existing capabilities are being modified at the requirements level -->

## Impact

**Code Affected**:
- `src/groups/groups.service.ts` — inject `StudyGroupSubject` and add `subject.notify()` calls in 4 methods
- `src/groups/groups.module.ts` — add `OnModuleInit`, register 3 new providers, import `MessagesModule`
- `src/messages/events/message.events.ts` — add 2 new events and 2 new payload interfaces

**New Files** (7 files):
- `src/groups/domain/observer/study-group-subject.ts`
- `src/groups/domain/observer/study-group-event.interface.ts`
- `src/groups/domain/observer/README.md`
- `src/groups/infrastructure/observers/websocket-notification.observer.ts`
- `src/groups/infrastructure/observers/persistence-notification.observer.ts`
- `src/groups/domain/observer/__tests__/study-group-subject.spec.ts`
- `src/groups/infrastructure/observers/__tests__/observers.spec.ts`

**Dependencies**:
- ✅ Reuses `ISubject<T>` and `IObserver<T>` from `src/messages/domain/observer/interfaces/`
- ✅ Reuses `ChatGateway` and `ChatSessionManager` from messages module
- ✅ Reuses `PrismaService` and existing `notification` model
- ⚠️ Requires importing `MessagesModule` in `GroupsModule`

**Compatibility**:
- ✅ Compatible with existing EventEmitter2 pattern (GroupActivityListener)
- ✅ No breaking changes to existing APIs
- ✅ Observer pattern coexists with EventEmitter2 for different purposes

**Testing**:
- Unit tests for `StudyGroupSubject` (attach, detach, notify)
- Unit tests for both observers (WebSocket emission, DB persistence)
- Integration tests for `GroupsService` with subject injection
