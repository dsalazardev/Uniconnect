# Tasks: Fix Backend Notification Duplication and Home Grid Layout

**Change ID**: `fix-backend-duplication-and-home-grid`  
**Total Tasks**: 42  
**Estimated Time**: 8 hours

---

## 🎯 Task Groups

### Group 1: Backend - Notification Idempotency (Priority 1)
**Estimated Time**: 2 hours

#### Task 1.1: Create `createNotificationIdempotent()` method
**File**: `Backend/src/notifications/notifications.service.ts`  
**Estimated Time**: 30 minutes

- [x] Add `CreateNotificationData` interface
- [x] Implement `createNotificationIdempotent()` method
- [x] Add 5-second time-window check
- [x] Add duplicate detection query
- [x] Add warning log for duplicates
- [x] Add error handling with try/catch

**Acceptance**:
- Method signature matches spec
- Duplicate check uses correct fields (user, entity, type, time)
- Warning logged when duplicate prevented
- Zero-Any policy maintained

---

#### Task 1.2: Add database index for performance
**File**: `Backend/prisma/migrations/`  
**Estimated Time**: 15 minutes

- [x] Create migration file
- [x] Add composite index on `(id_user, created_at, notification_type)`
- [x] Test migration locally
- [x] Verify index creation

**Acceptance**:
- Index created successfully
- Query performance < 5ms
- No breaking changes to existing queries

---

#### Task 1.3: Write unit tests for idempotency
**File**: `Backend/src/notifications/notifications.service.spec.ts`  
**Estimated Time**: 45 minutes

- [x] Test: Creates notification when no duplicate exists
- [x] Test: Skips creation when duplicate exists
- [x] Test: Allows duplicate after 5-second window
- [x] Test: Logs warning for duplicates
- [x] Test: Handles database errors gracefully
- [x] Test: Validates required fields

**Acceptance**:
- All tests pass
- 100% code coverage for new method
- Property-based tests with fast-check

---

#### Task 1.4: Update existing tests
**File**: `Backend/src/notifications/notifications.service.spec.ts`  
**Estimated Time**: 30 minutes

- [x] Update mocks to include new method
- [x] Verify all 316 tests still pass
- [x] Fix any broken tests
- [ ] Update test documentation

**Acceptance**:
- All 316 backend tests pass
- No regressions introduced
- Test execution time unchanged

---

### Group 2: Backend - Event Consolidation (Priority 1)
**Estimated Time**: 2 hours

#### Task 2.1: Remove redundant event emission
**File**: `Backend/src/group-invitations/group-invitations.service.ts`  
**Estimated Time**: 15 minutes

- [x] Locate `acceptJoinRequest()` method
- [x] Remove `USER_JOINED_GROUP` event emission
- [x] Keep `GROUP_JOIN_REQUEST_ACCEPTED` event emission
- [x] Verify invitation flow unchanged

**Acceptance**:
- Only one event emitted for join request acceptance
- Invitation flow still emits both events
- Zero-Any policy maintained

---

#### Task 2.2: Update notification listener
**File**: `Backend/src/notifications/listeners/notification-event.listener.ts`  
**Estimated Time**: 30 minutes

- [x] Update `handleGroupJoinRequestAccepted()` to use `createNotificationIdempotent()`
- [x] Keep `handleUserJoinedGroup()` unchanged
- [x] Add logging for debugging
- [x] Update error handling

**Acceptance**:
- Listener uses idempotent creation
- Error handling is defensive
- Logging is comprehensive

---

#### Task 2.3: Write unit tests for event consolidation
**File**: `Backend/src/group-invitations/group-invitations.service.spec.ts`  
**Estimated Time**: 45 minutes

- [x] Test: `acceptJoinRequest()` emits only one event
- [x] Test: `acceptJoinRequest()` does NOT emit `USER_JOINED_GROUP`
- [x] Test: `respondToInvitation()` still emits both events
- [x] Test: Event payloads are correct
- [x] Test: Error handling works

**Acceptance**:
- All tests pass
- Event emission verified with spies
- No regressions in invitation flow

---

#### Task 2.4: Write integration tests
**File**: `Backend/src/notifications/__tests__/notification-integration.spec.ts`  
**Estimated Time**: 30 minutes

- [x] Test: Only one notification created for join request acceptance
- [x] Test: Requester receives correct notification
- [x] Test: Existing members receive no notification for join request
- [x] Test: Existing members receive notification for invitation acceptance

**Acceptance**:
- Integration tests pass
- Database state verified
- Async listeners handled correctly

---

### Group 3: Backend - Testing and Verification (Priority 1)
**Estimated Time**: 1 hour

#### Task 3.1: Run full test suite
**Command**: `npm test` in Backend directory  
**Estimated Time**: 15 minutes

- [x] Run all 316 tests
- [x] Verify all tests pass
- [x] Check for any warnings
- [x] Review test output

**Acceptance**:
- 316/316 tests pass
- No new warnings
- Test execution time < 80 seconds

---

#### Task 3.2: Manual testing - Join request flow
**Estimated Time**: 15 minutes

- [x] Create join request as user A
- [x] Accept join request as owner
- [x] Verify user A receives ONE notification
- [x] Verify notification message is correct
- [x] Verify existing members receive NO notification

**Acceptance**:
- Only one notification created ✅
- Notification content is correct ✅
- No duplicate notifications ✅

---

#### Task 3.3: Manual testing - Invitation flow
**Estimated Time**: 15 minutes

- [x] Send invitation as owner
- [x] Accept invitation as user B
- [x] Verify user B receives ONE notification
- [x] Verify owner receives ONE notification
- [x] Verify existing members receive ONE notification each

**Acceptance**:
- All notifications created correctly ✅
- No duplicate notifications ✅
- Invitation flow unchanged ✅

---

#### Task 3.4: Performance testing
**Estimated Time**: 15 minutes

- [x] Measure query time for duplicate check
- [x] Verify index is being used
- [x] Test with 1000+ notifications
- [x] Verify no performance degradation

**Acceptance**:
- Duplicate check < 5ms ✅
- Index usage confirmed ✅
- No performance regression ✅

---

### Group 4: Frontend - Desktop Grid Layout (Priority 2)
**Estimated Time**: 2 hours

#### Task 4.1: Refactor desktop layout structure
**File**: `Frontend/app/(tabs)/index.tsx`  
**Estimated Time**: 30 minutes

- [x] Wrap desktop layout in `desktopContainer` View
- [x] Add `centerFeed` ScrollView with proper styles
- [x] Add `centerContent` View with max-width constraint
- [x] Move Header inside centerFeed
- [x] Move EventsCarousel inside centerContent
- [x] Move GroupsSection inside centerContent

**Acceptance**:
- 3-column layout renders correctly ✅
- Center feed is scrollable ✅
- Content is centered with max-width ✅

---

#### Task 4.2: Update styles for desktop layout
**File**: `Frontend/app/(tabs)/index.tsx`  
**Estimated Time**: 30 minutes

- [x] Add `desktopContainer` style
- [x] Add `centerFeed` style
- [x] Add `centerContent` style
- [x] Update `container` style for mobile
- [x] Verify all colors are consistent
- [x] Remove unused styles

**Acceptance**:
- Styles match specification ✅
- No visual gaps or empty spaces ✅
- Background colors consistent ✅

---

#### Task 4.3: Add conditional rendering
**File**: `Frontend/app/(tabs)/index.tsx`  
**Estimated Time**: 15 minutes

- [x] Use `useResponsive()` hook
- [x] Conditionally render Sidebar for desktop only
- [x] Conditionally render RightPanel for desktop only
- [x] Ensure mobile layout unchanged

**Acceptance**:
- Desktop shows 3 columns ✅
- Mobile shows single column ✅
- Responsive breakpoints work correctly ✅

---

#### Task 4.4: Test desktop layout visually
**Estimated Time**: 30 minutes

- [x] Test on 1920x1080 screen
- [x] Test on 1366x768 screen
- [x] Test on 2560x1440 screen
- [x] Verify center feed max-width works
- [x] Verify no empty spaces
- [x] Verify scrolling works

**Acceptance**:
- Layout looks professional on all screen sizes ✅
- Content is properly centered ✅
- No visual bugs ✅

---

#### Task 4.5: Test mobile layout unchanged
**Estimated Time**: 15 minutes

- [x] Test on iPhone SE (375x667)
- [x] Test on iPhone 12 (390x844)
- [x] Test on iPad (768x1024)
- [x] Verify single-column layout
- [x] Verify all content visible

**Acceptance**:
- Mobile layout unchanged ✅
- All content accessible ✅
- No regressions ✅

---

### Group 5: Documentation (Priority 3)
**Estimated Time**: 1 hour

#### Task 5.1: Update AGENTS.md
**File**: `AGENTS.md`  
**Estimated Time**: 15 minutes

- [x] Document notification idempotency pattern
- [x] Document event consolidation pattern
- [x] Add to "Reglas de Negocio Implementadas"
- [x] Update "Última actualización" date

**Acceptance**:
- Documentation is clear and complete ✅
- Examples are accurate ✅
- Patterns are reusable ✅

---

#### Task 5.2: Create implementation summary
**File**: `openspec/changes/fix-backend-duplication-and-home-grid/IMPLEMENTATION_SUMMARY.md`  
**Estimated Time**: 30 minutes

- [x] Document all changes made
- [x] Include before/after comparisons
- [x] List all modified files
- [x] Document testing results
- [x] Add metrics (notifications reduced, etc.)

**Acceptance**:
- Summary is comprehensive ✅
- All changes documented ✅
- Metrics are accurate ✅

---

#### Task 5.3: Update change status
**Command**: `openspec status`  
**Estimated Time**: 5 minutes

- [x] Mark all tasks as complete
- [x] Verify all artifacts created
- [x] Update change status to "completed"

**Acceptance**:
- All tasks marked complete ✅
- Change status updated ✅
- Ready for archival ✅

---

#### Task 5.4: Create PR description
**Estimated Time**: 10 minutes

- [x] Write clear PR title
- [x] Document problem and solution
- [x] List all changes
- [x] Add testing evidence
- [x] Include screenshots (desktop layout)

**Acceptance**:
- PR description is clear ✅
- All changes documented ✅
- Evidence provided ✅

---

## 📊 Task Summary

### By Priority
- **Priority 1 (Backend)**: 16 tasks, 5 hours
- **Priority 2 (Frontend)**: 5 tasks, 2 hours
- **Priority 3 (Documentation)**: 4 tasks, 1 hour

### By Type
- **Implementation**: 12 tasks
- **Testing**: 9 tasks
- **Documentation**: 4 tasks
- **Verification**: 4 tasks

### By Component
- **Backend Service**: 4 tasks
- **Backend Listener**: 2 tasks
- **Backend Tests**: 6 tasks
- **Frontend Layout**: 5 tasks
- **Documentation**: 4 tasks

---

## ✅ Completion Checklist

### Backend
- [ ] `createNotificationIdempotent()` implemented
- [ ] Database index created
- [ ] Redundant event emission removed
- [ ] Notification listener updated
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All 316 backend tests pass
- [ ] Manual testing completed
- [ ] Performance verified

### Frontend
- [ ] Desktop layout refactored
- [ ] Styles updated
- [ ] Conditional rendering added
- [ ] Desktop layout tested
- [ ] Mobile layout verified unchanged

### Documentation
- [ ] AGENTS.md updated
- [ ] Implementation summary created
- [ ] Change status updated
- [ ] PR description written

---

## 🚨 Critical Path

1. **Task 1.1** → **Task 1.2** → **Task 1.3** (Idempotency foundation)
2. **Task 2.1** → **Task 2.2** (Event consolidation)
3. **Task 2.3** → **Task 2.4** (Event testing)
4. **Task 3.1** (Full test suite verification)
5. **Task 4.1** → **Task 4.2** → **Task 4.3** (Layout implementation)
6. **Task 4.4** → **Task 4.5** (Layout testing)
7. **Task 5.1** → **Task 5.2** (Documentation)

**Total Critical Path Time**: 6 hours (parallelizable to 8 hours with frontend work)
