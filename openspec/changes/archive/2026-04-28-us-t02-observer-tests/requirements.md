# Requirements: US-T02 - Unit Tests for Observer Pattern

## Overview

Complete unit testing for the Observer pattern in the **Study Groups domain** to achieve 100% compliance across all acceptance criteria. The Chat domain already has comprehensive test coverage (31 tests), but Study Groups domain has **zero tests** (0% coverage).

**Story Points**: 3 pts  
**Estimated Time**: ~1.2 hours  
**Priority**: High (blocks pattern validation)

---

## Current State Analysis

### Chat Domain (Messages) - ✅ COMPLETE
- **ChatSubject Tests**: 10 tests passing
- **Observer Tests**: 9 tests passing (PrivateChatObserver, GroupChatObserver)
- **Integration Tests**: 12 tests passing (Gateway + Observers)
- **Total**: 31 tests
- **Coverage**: 100% for AC1-AC5

### Study Groups Domain - ❌ INCOMPLETE
- **StudyGroupSubject Tests**: 0 tests (MISSING)
- **Observer Tests**: 0 tests (MISSING)
- **Integration Tests**: 0 tests (MISSING)
- **Total**: 0 tests
- **Coverage**: 0% for AC1-AC5

**Gap**: 24 tests required to achieve parity with Chat domain

---

## Acceptance Criteria

### AC1: Multiple Observers Receive Event
**Given** a Subject with 2 observers subscribed  
**When** `notify()` is called  
**Then** both observers receive the event

**Validation**:
- Test must attach 2 mock observers to StudyGroupSubject
- Call `notify()` with a StudyGroupEvent
- Assert both observers' `update()` methods were called with the event

**Success Metric**: Test passes, validates observer notification

---

### AC2: Unsubscribed Observer Doesn't Receive Event
**Given** an observer that unsubscribes  
**When** the subject notifies  
**Then** that observer no longer receives the event

**Validation**:
- Test must attach observer, then detach it
- Call `notify()` after detachment
- Assert observer's `update()` method was NOT called

**Success Metric**: Test passes, validates detachment lifecycle

---

### AC3: Error Isolation Between Observers
**Given** an observer throws an exception  
**When** the subject notifies  
**Then** other observers still receive the event (error isolation)

**Validation**:
- Test must attach 2 observers: one that throws, one that succeeds
- Call `notify()`
- Assert throwing observer doesn't break notification
- Assert successful observer still receives event

**Success Metric**: Test passes, validates error isolation

---

### AC4: Tests Use Mocks (No Real Dependencies)
**Given** tests use mocks/stubs for observers  
**When** tests execute  
**Then** no real WebSocket or database dependencies are used

**Validation**:
- All observers must be Jest mocks (`jest.fn()`)
- ChatSessionManager must be mocked
- PrismaService must be mocked
- No real Socket.IO connections

**Success Metric**: All tests use `jest.Mocked<T>` or `jest.fn()`

---

### AC5: Integration Test with Main Observer
**Given** each Subject (Study Groups, Chat) has integration test  
**When** Subject notifies  
**Then** main observer receives and processes event correctly

**Validation**:
- Test must validate StudyGroupSubject → WebSocketNotificationObserver flow
- Test must validate StudyGroupSubject → PersistenceNotificationObserver flow
- Test must validate both observers receive event simultaneously

**Success Metric**: Integration test passes, validates end-to-end flow

---

## Functional Requirements

### FR1: StudyGroupSubject Unit Tests
**Requirement**: Implement comprehensive unit tests for StudyGroupSubject

**Test Coverage**:
1. **attach()** - 3 tests
   - Should attach observer to subject
   - Should prevent duplicate observers
   - Should attach multiple different observers

2. **detach()** - 3 tests
   - Should detach observer from subject
   - Should handle detaching non-existent observer
   - Should detach only specified observer

3. **notify()** - 4 tests
   - Should notify all attached observers (AC1)
   - Should notify correct number of observers
   - Should handle observer errors gracefully (AC3)
   - Should handle empty observer list

**Total**: 10 tests

**Pattern**: Mirror `chat-subject.spec.ts` structure

---

### FR2: Observer Unit Tests
**Requirement**: Implement unit tests for Study Groups observers

**Test Coverage**:

#### WebSocketNotificationObserver - 4 tests
1. Should emit notification via ChatSessionManager
2. Should handle missing user session gracefully
3. Should handle gateway errors gracefully (AC3)
4. Should validate event type filtering

#### PersistenceNotificationObserver - 4 tests
1. Should persist notification to database
2. Should handle missing user data gracefully
3. Should handle database errors gracefully (AC3)
4. Should validate notification type mapping

**Total**: 8 tests

**Pattern**: Mirror `observers.spec.ts` structure

---

### FR3: Integration Tests
**Requirement**: Implement integration tests for StudyGroupSubject with observers

**Test Coverage**:
1. **StudyGroupSubject + WebSocketNotificationObserver** - 2 tests
   - Should notify WebSocket observer on JOIN_REQUEST
   - Should notify WebSocket observer on MEMBER_ACCEPTED

2. **StudyGroupSubject + PersistenceNotificationObserver** - 2 tests
   - Should notify Persistence observer on JOIN_REQUEST
   - Should notify Persistence observer on MEMBER_ACCEPTED

3. **Multiple Observers** - 2 tests
   - Should notify both observers simultaneously (AC1)
   - Should isolate errors between observers (AC3)

**Total**: 6 tests

**Pattern**: Mirror `messages.gateway.observer.spec.ts` structure

---

## Non-Functional Requirements

### NFR1: Test Execution Performance
- All 24 tests must execute in <2 seconds
- No real I/O operations (network, database, file system)
- Use in-memory mocks exclusively

### NFR2: Code Quality
- **Zero-Any Policy**: No `any` types in test code
- **English Language**: All identifiers, comments, and strings in English
- **TypeScript Strict Mode**: All tests must compile with strict mode
- **Consistent Naming**: Follow existing test naming conventions

### NFR3: Mock Isolation
- Each test must use fresh mock instances (via `beforeEach`)
- Mocks must be cleared after each test (via `afterEach`)
- No shared state between tests

### NFR4: Test Independence
- Tests must be runnable in any order
- Tests must not depend on other tests' side effects
- Each test must set up its own fixtures

---

## Technical Constraints

### TC1: File Locations
**Constraint**: Tests must be placed in specific directories

**Locations**:
- Subject tests: `Backend/src/groups/domain/observer/__tests__/study-group-subject.spec.ts`
- Observer tests: `Backend/src/groups/infrastructure/observers/__tests__/`
  - `websocket-notification.observer.spec.ts`
  - `persistence-notification.observer.spec.ts`
- Integration tests: `Backend/src/groups/__tests__/study-group-subject.integration.spec.ts`

### TC2: Mock Dependencies
**Constraint**: Tests must mock all external dependencies

**Required Mocks**:
- `IObserver<StudyGroupEvent>` - Jest mock function
- `ChatSessionManager` - `jest.Mocked<ChatSessionManager>`
- `PrismaService` - `jest.Mocked<PrismaService>`
- `Server` (Socket.IO) - Mocked with `jest.fn()`

### TC3: Test Framework
**Constraint**: Use Jest testing framework exclusively

**Required Imports**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { StudyGroupSubject } from '../study-group-subject';
import { IObserver } from '../../../../messages/domain/observer/interfaces';
import { StudyGroupEvent } from '../study-group-event.interface';
```

### TC4: Event Types
**Constraint**: Tests must use valid StudyGroupEvent types

**Valid Event Types**:
- `JOIN_REQUEST`
- `MEMBER_ACCEPTED`
- `MEMBER_REJECTED`
- `ADMIN_TRANSFER_REQUESTED`
- `ADMIN_TRANSFER_ACCEPTED`

---

## Success Metrics

### Quantitative Metrics
- ✅ 24 tests implemented (10 Subject + 8 Observer + 6 Integration)
- ✅ 100% test pass rate
- ✅ Test execution time <2 seconds
- ✅ Zero-Any policy maintained (0 `any` types)
- ✅ Build succeeds without errors

### Qualitative Metrics
- ✅ All 5 AC criteria validated with evidence
- ✅ Test coverage parity with Chat domain
- ✅ Mock usage consistent across all tests
- ✅ Error isolation validated in multiple scenarios

---

## Out of Scope

### Excluded from US-T02
- ❌ Modifying existing Chat domain tests
- ❌ Implementing new Observer pattern features
- ❌ Refactoring existing StudyGroupSubject implementation
- ❌ Adding new event types to StudyGroupEvent
- ❌ Performance optimization of Observer pattern
- ❌ E2E tests with real WebSocket connections

---

## Dependencies

### Internal Dependencies
- ✅ StudyGroupSubject implementation exists
- ✅ WebSocketNotificationObserver implementation exists
- ✅ PersistenceNotificationObserver implementation exists
- ✅ StudyGroupEvent interface exists
- ✅ IObserver interface exists

### External Dependencies
- ✅ Jest 30.x installed
- ✅ @nestjs/testing installed
- ✅ TypeScript 5.7.x installed

---

## Risk Assessment

### Risk 1: Test Pattern Mismatch
**Risk**: Study Groups tests don't match Chat domain patterns  
**Mitigation**: Use Chat tests as exact template, only swap types  
**Likelihood**: Low  
**Impact**: Medium

### Risk 2: Mock Configuration Complexity
**Risk**: ChatSessionManager/PrismaService mocks are complex  
**Mitigation**: Reference existing mock patterns in codebase  
**Likelihood**: Medium  
**Impact**: Low

### Risk 3: Event Type Validation
**Risk**: Invalid event types cause test failures  
**Mitigation**: Use StudyGroupEvent interface for type safety  
**Likelihood**: Low  
**Impact**: Low

---

## Validation Checklist

### Pre-Implementation
- [ ] Diagnostic report reviewed and understood
- [ ] Chat domain tests analyzed as reference
- [ ] StudyGroupSubject implementation reviewed
- [ ] Observer implementations reviewed

### During Implementation
- [ ] Each test follows AAA pattern (Arrange-Act-Assert)
- [ ] Mocks are properly typed with `jest.Mocked<T>`
- [ ] No `any` types used
- [ ] All identifiers in English

### Post-Implementation
- [ ] All 24 tests pass
- [ ] Test execution time <2 seconds
- [ ] Build succeeds without errors
- [ ] Zero-Any policy validated
- [ ] All 5 AC criteria met with evidence

---

## Acceptance Criteria Validation Matrix

| AC | Test File | Test Name | Status |
|----|-----------|-----------|--------|
| **AC1** | study-group-subject.spec.ts | should notify all attached observers | ⏳ Pending |
| **AC2** | study-group-subject.spec.ts | should detach observer from subject | ⏳ Pending |
| **AC3** | study-group-subject.spec.ts | should handle observer errors gracefully | ⏳ Pending |
| **AC3** | websocket-notification.observer.spec.ts | should handle gateway errors gracefully | ⏳ Pending |
| **AC3** | persistence-notification.observer.spec.ts | should handle database errors gracefully | ⏳ Pending |
| **AC4** | All test files | Mock usage validation | ⏳ Pending |
| **AC5** | study-group-subject.integration.spec.ts | should notify both observers simultaneously | ⏳ Pending |

---

**Document Version**: 1.0  
**Created**: 28 de Abril, 2026  
**Status**: Ready for Design Phase
