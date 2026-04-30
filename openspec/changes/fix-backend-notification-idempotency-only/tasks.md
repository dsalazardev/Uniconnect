# Implementation Tasks: Notification Idempotency

## 1. Eliminate EventEmitter Redundancy

- [ ] 1.1 Remove `eventEmitter.emit(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED, ...)` from `acceptJoinRequest()` in `Backend/src/groups/groups.service.ts`
- [ ] 1.2 Verify `studyGroupSubject.notify()` remains in `acceptJoinRequest()` (single notification mechanism)
- [ ] 1.3 Remove `handleGroupJoinRequestAccepted()` method from `Backend/src/notifications/listeners/notification-event.listener.ts`
- [ ] 1.4 Verify no other code references the removed EventEmitter handler
- [ ] 1.5 Verify TypeScript compilation succeeds with no errors

## 2. Database Migration

- [ ] 2.1 Create migration file for composite index on `(id_user, created_at, notification_type)`
- [ ] 2.2 Verify migration syntax and naming convention
- [ ] 2.3 Test migration locally on development database
- [ ] 2.4 Verify index creation and query performance

## 3. Service Method Implementation

- [ ] 3.1 Add `CreateNotificationIdempotentData` interface to `notifications.service.ts`
- [ ] 3.2 Implement `createNotificationIdempotent()` method with 5-second window check
- [ ] 3.3 Add duplicate detection query using collision key `[userId + related_entity_id]`
- [ ] 3.4 Implement return logic: return existing record if duplicate detected
- [ ] 3.5 Add defensive error handling with try/catch
- [ ] 3.6 Add logging for duplicate prevention and errors
- [ ] 3.7 Verify strict TypeScript typing (zero `any` types)
- [ ] 3.8 Add JSDoc comments explaining method behavior

## 4. Observer Integration

- [ ] 4.1 Update `PersistenceNotificationObserver` to use `createNotificationIdempotent()` instead of direct Prisma calls
- [ ] 4.2 Verify Observer pattern handles all notifications (single channel)
- [ ] 4.3 Add logging for observer method execution
- [ ] 4.4 Verify no EventEmitter listeners remain for group join requests

## 5. Unit Tests

- [ ] 5.1 Create test file `notifications.service.idempotency.spec.ts`
- [ ] 5.2 Write test: First notification creation succeeds
- [ ] 5.3 Write test: Duplicate within 5-second window is prevented
- [ ] 5.4 Write test: Duplicate after 5-second window is allowed
- [ ] 5.5 Write test: Different entities create separate notifications
- [ ] 5.6 Write test: Different users create separate notifications
- [ ] 5.7 Write property-based tests with fast-check for idempotency
- [ ] 5.8 Write property-based tests for preservation of non-buggy behavior
- [ ] 5.9 Write tests for error handling and logging
- [ ] 5.10 Verify 100% code coverage for new method

## 6. Integration Tests

- [ ] 6.1 Create integration test file `notification-observer.idempotency.spec.ts`
- [ ] 6.2 Write test: `acceptJoinRequest()` creates single notification via Observer
- [ ] 6.3 Write test: Rapid event firing creates only one notification
- [ ] 6.4 Write test: EventEmitter is not called from `acceptJoinRequest()`
- [ ] 6.5 Write test: Database state is consistent after idempotent operations

## 7. Verification and Testing

- [ ] 7.1 Run full backend test suite: `npm test` in Backend directory
- [ ] 7.2 Verify all 327+ tests pass
- [ ] 7.3 Verify no TypeScript compilation errors
- [ ] 7.4 Verify no implicit `any` types in implementation
- [ ] 7.5 Run linter: `npm run lint`
- [ ] 7.6 Check code coverage: `npm run test:cov`

## 8. Documentation

- [ ] 8.1 Update AGENTS.md with notification idempotency pattern
- [ ] 8.2 Add code comments explaining collision key logic
- [ ] 8.3 Document the 5-second window rationale
- [ ] 8.4 Document EventEmitter elimination and Observer consolidation
- [ ] 8.5 Create implementation summary document

## 9. Code Review Preparation

- [ ] 9.1 Verify all changes are in `Backend/src/` directory only
- [ ] 9.2 Verify EventEmitter redundancy is completely eliminated
- [ ] 9.3 Verify Observer pattern is the single notification mechanism
- [ ] 9.4 Prepare PR description with before/after comparison
- [ ] 9.5 Document testing results and metrics

## 10. Deployment Preparation

- [ ] 10.1 Create deployment checklist
- [ ] 10.2 Document rollback procedure
- [ ] 10.3 Prepare monitoring queries for duplicate detection
- [ ] 10.4 Document performance impact of new index
- [ ] 10.5 Verify zero duplicate notifications in production
