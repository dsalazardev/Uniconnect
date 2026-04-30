## Context

The Uniconnect backend has **redundant notification mechanisms** causing duplicate records (IDs 287, 288). The `acceptJoinRequest()` method in `GroupsService` uses **two independent channels**:
1. **EventEmitter pattern**: `eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)` → `NotificationEventListener.handleGroupJoinRequestAccepted()` → `prisma.notification.create()`
2. **Observer pattern**: `studyGroupSubject.notify()` → `PersistenceNotificationObserver.update()` → `prisma.notification.create()`

When both fire simultaneously, duplicate records are created. The solution is to **consolidate to single Observer pattern** and eliminate the redundant EventEmitter.

**Current State:**
- `acceptJoinRequest()` emits via both EventEmitter and Observer (redundant)
- `NotificationEventListener` listens to EventEmitter and creates notifications
- `PersistenceNotificationObserver` listens to Observer and creates notifications
- No collision detection or idempotency checks exist
- Database has no composite index for efficient duplicate detection

**Constraints:**
- Must eliminate EventEmitter redundancy for `GROUP_JOIN_REQUEST_ACCEPTED`
- Must preserve Observer pattern (primary notification mechanism)
- Must maintain 100% strict TypeScript typing (Zero-Any policy)
- Must not modify other event emission logic in services
- Solution must be isolated to notification service layer and group service

**Stakeholders:**
- Backend developers maintaining notification system
- QA team testing notification delivery
- Users receiving notifications

## Goals / Non-Goals

**Goals:**
- Eliminate redundant EventEmitter mechanism from `acceptJoinRequest()` in `GroupsService`
- Consolidate to single Observer pattern as primary notification mechanism
- Implement idempotent notification creation that prevents duplicates within a 5-second window
- Use collision key `[userId + related_entity_id]` to detect duplicates regardless of `notification_type` variation
- Add database index for query performance optimization
- Update `PersistenceNotificationObserver` to use idempotent method
- Remove redundant `handleGroupJoinRequestAccepted()` from `NotificationEventListener`
- Maintain 100% strict TypeScript typing throughout
- Add comprehensive unit tests with property-based testing

**Non-Goals:**
- Modifying other event emission logic in services (only `acceptJoinRequest()` is changed)
- Changing the Observer or Decorator pattern implementations
- Altering the structure of notification records
- Implementing distributed locking or external idempotency services
- Changing notification listener behavior beyond using idempotent method

## Decisions

### Decision 0: Eliminate EventEmitter Redundancy - Single Observer Pattern

**Choice:** Remove `eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)` from `acceptJoinRequest()` in `GroupsService`. Keep only `studyGroupSubject.notify()` as the single notification mechanism.

**Rationale:**
- **Why eliminate EventEmitter:** Dual-channel approach causes duplicate records; single channel is simpler and more maintainable
- **Why keep Observer:** Observer pattern is the primary, well-tested notification mechanism; no need for redundant EventEmitter
- **Why this is safe:** `PersistenceNotificationObserver` already handles the notification creation; EventEmitter listener is redundant
- **Why remove listener:** `NotificationEventListener.handleGroupJoinRequestAccepted()` becomes dead code once EventEmitter is removed

**Alternatives Considered:**
1. **Keep both channels:** Causes duplicates; not acceptable
2. **Keep EventEmitter, remove Observer:** Would require rewriting Observer pattern; unnecessary complexity
3. **Implement deduplication at EventEmitter level:** Adds complexity; better to eliminate redundancy at source

### Decision 1: Idempotency Strategy - Time-Window Collision Detection

**Choice:** Implement `createNotificationIdempotent()` method that checks for existing notifications within a 5-second window using collision key `[userId + related_entity_id]`.

**Rationale:**
- **Why this approach:** 5-second window captures rapid event firing (typical race condition window) while allowing legitimate duplicate notifications after the window expires
- **Why collision key:** Using `userId + related_entity_id` ignores `notification_type` variations, preventing duplicates even when different event types fire for the same user+entity
- **Why not distributed locking:** Adds complexity and external dependency; time-window approach is simpler and sufficient for this use case
- **Why not event deduplication:** Would require modifying event emission logic (violates constraint); idempotency at persistence layer is cleaner

**Alternatives Considered:**
1. **Distributed locking (Redis):** More robust but adds infrastructure complexity and latency
2. **Event deduplication in EventEmitter:** Would require modifying event emission logic, violating preservation constraint
3. **Database unique constraint:** Cannot use because `notification_type` varies; would require composite unique index that's too restrictive

### Decision 2: Collision Key Components

**Choice:** Use `[userId + related_entity_id]` as collision key, ignoring `notification_type`.

**Rationale:**
- **Why userId + related_entity_id:** These uniquely identify the user+action combination; if both are identical within 5 seconds, it's a duplicate
- **Why ignore notification_type:** Different event types (e.g., `member_accepted` vs `group_join_request_accepted`) for the same user+entity within 5 seconds are duplicates of the same action
- **Why not include notification_type:** Would create false positives; different notification types for same user+entity are legitimate

**Alternatives Considered:**
1. **Include notification_type in key:** Would allow duplicates with different types; not desired
2. **Use only userId:** Too broad; would prevent legitimate notifications for different entities
3. **Use only related_entity_id:** Too broad; would prevent legitimate notifications for different users

### Decision 3: Duplicate Handling - Return Existing Record

**Choice:** When duplicate detected, return existing notification record instead of creating new one.

**Rationale:**
- **Why return existing:** Idempotent operation; caller gets consistent result regardless of duplicate attempts
- **Why not skip silently:** Caller needs to know operation succeeded; returning record provides confirmation
- **Why not throw error:** Would break idempotency contract; caller shouldn't need to handle duplicate as error

**Alternatives Considered:**
1. **Throw error on duplicate:** Breaks idempotency; caller must handle as special case
2. **Return null:** Ambiguous; caller can't distinguish success from failure
3. **Log and skip:** Silent failure; no feedback to caller

### Decision 4: Database Index Strategy

**Choice:** Create composite index on `(id_user, created_at, notification_type)` for query optimization.

**Rationale:**
- **Why composite index:** Enables efficient range queries for 5-second window check
- **Why this order:** `id_user` first (most selective), then `created_at` (range query), then `notification_type` (filtering)
- **Why not unique constraint:** Cannot enforce uniqueness because `notification_type` varies; index is for query performance only

**Alternatives Considered:**
1. **Unique constraint:** Cannot use; `notification_type` varies for same user+entity
2. **Separate indexes:** Less efficient; composite index better for range queries
3. **No index:** Query performance degrades with large notification tables

### Decision 5: Observer Integration - Single Channel

**Choice:** Update `PersistenceNotificationObserver` to use idempotent method. Remove `handleGroupJoinRequestAccepted()` from `NotificationEventListener` (no longer needed).

**Rationale:**
- **Why update Observer:** Observer is the primary notification mechanism; must use idempotent method to prevent duplicates
- **Why remove EventEmitter listener:** Once EventEmitter is removed from `acceptJoinRequest()`, this listener becomes dead code
- **Why this is safe:** Observer pattern already handles all notification creation; removing EventEmitter listener has no side effects

**Alternatives Considered:**
1. **Keep EventEmitter listener:** Redundant; would still create duplicates if EventEmitter is used elsewhere
2. **Update both listeners:** Unnecessary; only Observer is needed
3. **Create new observer:** Adds complexity; updating existing observer is simpler

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Race condition in 5-second window** → Two concurrent requests both check and create | Use database transaction for atomic check+create; Prisma handles this automatically |
| **Performance degradation with large notification tables** → Index query becomes slow | Composite index on `(id_user, created_at, notification_type)` ensures O(log n) performance |
| **Stale data in 5-second window** → Notification created just before window expires | 5-second window is conservative; legitimate duplicates after window are acceptable |
| **Breaking change if callers expect exceptions** → Code relying on duplicate exceptions breaks | No existing code relies on duplicate exceptions; idempotent behavior is improvement |
| **Incomplete migration of observers** → Some handlers still create duplicates | Phased approach: update `handleGroupJoinRequestAccepted()` first, monitor, then update others if needed |

## Migration Plan

**Phase 1: Database Index (0 downtime)**
1. Create migration file with composite index
2. Deploy migration to production
3. Verify index creation and query performance

**Phase 2: Service Method (0 downtime)**
1. Add `createNotificationIdempotent()` method to `NotificationsService`
2. Add unit tests for idempotency logic
3. Deploy to production (method unused initially)

**Phase 3: Observer Update (0 downtime)**
1. Update `PersistenceNotificationObserver` to use idempotent method
2. Add integration tests
3. Deploy to production

**Phase 4: Eliminate EventEmitter Redundancy (0 downtime)**
1. Remove `eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)` from `acceptJoinRequest()` in `GroupsService`
2. Remove `handleGroupJoinRequestAccepted()` from `NotificationEventListener`
3. Verify Observer pattern handles all notifications
4. Deploy to production
5. Monitor for duplicate notifications (should remain zero)

**Rollback Strategy:**
- Phase 1: Index can be dropped without affecting functionality
- Phase 2: Method can be removed if issues arise
- Phase 3: Observer can revert to direct `prisma.notification.create()` if needed
- Phase 4: EventEmitter emit can be restored if Observer fails

## Open Questions

1. **Should we update other observers?** Current plan is to update only `PersistenceNotificationObserver`. Should we proactively update all observers or wait for duplicate issues to appear?
2. **What is acceptable duplicate rate?** Is zero duplicates required, or is <1% acceptable?
3. **Should we add metrics/monitoring?** Should we track duplicate prevention events for observability?
4. **Long-term solution:** Is 5-second window sufficient, or should we implement distributed idempotency (e.g., Redis)?
5. **Are there other EventEmitter listeners that should be removed?** Should we audit other services for similar redundancy?
