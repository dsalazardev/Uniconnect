# Tasks: US-T01 - Unit Tests for Decorator Pattern

## Overview

Complete unit testing for Decorator pattern across messages (existing) and profiles (new implementation).

**Estimated Time**: ~1 hour  
**Story Points**: 3 pts

---

## Phase 1: Message Decorator Tests (AC4)

### Task 1.1: Add Negative Test to BaseMessage
- [x] Open `Backend/src/messages/domain/decorator/__tests__/base-message.spec.ts`
- [x] Add new test case in `describe('render')` block
- [x] Test name: `'should NOT include decorator fields without decorators'`
- [x] Assert `parsed.files` is undefined
- [x] Assert `parsed.mentions` is undefined
- [x] Assert `parsed.reactions` is undefined
- [x] Run `npm test -- base-message.spec.ts` to verify

**Acceptance**: Test passes, validates AC4

---

## Phase 2: Profile Decorator Implementation

### Task 2.1: Create Directory Structure
- [x] Create directory `Backend/src/users/domain/`
- [x] Create directory `Backend/src/users/domain/decorator/`
- [x] Create directory `Backend/src/users/domain/decorator/interfaces/`
- [x] Create directory `Backend/src/users/domain/decorator/__tests__/`

### Task 2.2: Create IProfile Interface
- [x] Create file `Backend/src/users/domain/decorator/interfaces/profile.interface.ts`
- [x] Define `IProfile` interface with methods:
  - `getBasicInfo(): { userId: number; username: string; email: string }`
  - `getMetadata(): Record<string, unknown>`
  - `render(): string`
- [x] Export interface

### Task 2.3: Create Interface Index
- [x] Create file `Backend/src/users/domain/decorator/interfaces/index.ts`
- [x] Export `IProfile` from `profile.interface.ts`

### Task 2.4: Create BaseProfile Class
- [x] Create file `Backend/src/users/domain/decorator/base-profile.ts`
- [x] Import `IProfile` interface
- [x] Implement `BaseProfile` class:
  - Constructor with `userId`, `username`, `email` (readonly)
  - Implement `getBasicInfo()` method
  - Implement `getMetadata()` method (return createdAt timestamp)
  - Implement `render()` method (return JSON with basic fields only)
- [x] Export class

### Task 2.5: Create ProfileDecorator Abstract Class
- [x] Create file `Backend/src/users/domain/decorator/profile-decorator.abstract.ts`
- [x] Import `IProfile` interface
- [x] Implement abstract `ProfileDecorator` class:
  - Constructor with `profile: IProfile` (protected readonly)
  - Implement `getBasicInfo()` - delegate to wrapped profile
  - Implement `getMetadata()` - delegate to wrapped profile
  - Declare abstract `render(): string` method
- [x] Export class

### Task 2.6: Create VerifiedProfileDecorator Class
- [x] Create file `Backend/src/users/domain/decorator/verified-profile.decorator.ts`
- [x] Import `IProfile` and `ProfileDecorator`
- [x] Implement `VerifiedProfileDecorator` class:
  - Extend `ProfileDecorator`
  - Constructor with `profile`, `verifiedAt: Date`, `verifiedBy: string` (readonly)
  - Implement `render()` method:
    - Parse base profile JSON
    - Spread base data
    - Add `verified: true`
    - Add `verifiedAt` (ISO string)
    - Add `verifiedBy`
    - Return JSON string
- [x] Export class

### Task 2.7: Create Profile Decorator Index
- [x] Create file `Backend/src/users/domain/decorator/index.ts`
- [x] Export all interfaces from `interfaces/`
- [x] Export `BaseProfile`
- [x] Export `ProfileDecorator`
- [x] Export `VerifiedProfileDecorator`

---

## Phase 3: Profile Decorator Tests

### Task 3.1: Create BaseProfile Tests
- [x] Create file `Backend/src/users/domain/decorator/__tests__/base-profile.spec.ts`
- [x] Import `BaseProfile`
- [x] Create `describe('BaseProfile')` block
- [x] Setup test data: `userId = 1`, `username = 'johndoe'`, `email = 'john@example.com'`
- [x] Create `beforeEach` to instantiate `BaseProfile`

#### Test 3.1.1: getBasicInfo
- [x] Create `describe('getBasicInfo')` block
- [x] Test: `'should return userId, username, and email'`
- [x] Assert `info.userId` equals `userId`
- [x] Assert `info.username` equals `username`
- [x] Assert `info.email` equals `email`

#### Test 3.1.2: render - positive
- [x] Create `describe('render')` block
- [x] Test: `'should return JSON with basic fields only'`
- [x] Parse rendered JSON
- [x] Assert `parsed.userId` equals `userId`
- [x] Assert `parsed.username` equals `username`
- [x] Assert `parsed.email` equals `email`

#### Test 3.1.3: render - negative (AC4 for profiles)
- [x] Test: `'should NOT include verified field'`
- [x] Parse rendered JSON
- [x] Assert `parsed.verified` is undefined
- [x] Assert `parsed.verifiedAt` is undefined
- [x] Assert `parsed.verifiedBy` is undefined

**Acceptance**: 3 tests pass (exceeds AC5 requirement of ≥2)

### Task 3.2: Create VerifiedProfileDecorator Tests
- [x] Create file `Backend/src/users/domain/decorator/__tests__/verified-profile.decorator.spec.ts`
- [x] Import `BaseProfile` and `VerifiedProfileDecorator`
- [x] Create `describe('VerifiedProfileDecorator')` block
- [x] Setup test data: same as BaseProfile + `verifiedAt`, `verifiedBy`
- [x] Create `beforeEach` to instantiate both `BaseProfile` and `VerifiedProfileDecorator`

#### Test 3.2.1: getBasicInfo delegation
- [x] Create `describe('getBasicInfo')` block
- [x] Test: `'should delegate to wrapped profile'`
- [x] Call `decoratedProfile.getBasicInfo()`
- [x] Assert `info.userId` equals `userId`
- [x] Assert `info.username` equals `username`
- [x] Assert `info.email` equals `email`

#### Test 3.2.2: render - includes verification
- [x] Create `describe('render')` block
- [x] Test: `'should include verified field in JSON'`
- [x] Parse rendered JSON
- [x] Assert `parsed.verified` is `true`
- [x] Assert `parsed.verifiedAt` equals `verifiedAt.toISOString()`
- [x] Assert `parsed.verifiedBy` equals `verifiedBy`

#### Test 3.2.3: render - preserves base fields
- [x] Test: `'should preserve base profile fields'`
- [x] Parse rendered JSON
- [x] Assert `parsed.userId` equals `userId`
- [x] Assert `parsed.username` equals `username`
- [x] Assert `parsed.email` equals `email`

**Acceptance**: 3 tests pass (exceeds AC5 requirement of ≥2)

---

## Phase 4: Documentation

### Task 4.1: Create Profile Decorator README
- [x] Create file `Backend/src/users/domain/decorator/README.md`
- [x] Add title: "Decorator Pattern - User Profiles"
- [x] Add overview section explaining pattern usage
- [x] Add UML class diagram in Mermaid:
  - `IProfile` interface
  - `BaseProfile` class
  - `ProfileDecorator` abstract class
  - `VerifiedProfileDecorator` class
  - Show relationships (implements, extends)
- [x] Add usage examples with TypeScript code
- [x] Add section on extending with new decorators

---

## Phase 5: Verification

### Task 5.1: Run Message Decorator Tests
- [x] Execute `npm test -- "src/messages/domain/decorator"`
- [x] Verify all tests pass (20 tests: 19 existing + 1 AC4)
- [x] Verify test execution time <2 seconds

### Task 5.2: Run Profile Decorator Tests
- [x] Execute `npm test -- "src/users/domain/decorator"`
- [x] Verify all tests pass (6 tests: 3 BaseProfile + 3 VerifiedProfileDecorator)
- [x] Verify test execution time <1 second

### Task 5.3: Run All Decorator Tests
- [x] Execute `npm test -- decorator`
- [x] Verify total: 26 tests passing
- [x] Verify no test failures or warnings

### Task 5.4: Verify Build
- [x] Execute `npm run build` in Backend directory
- [x] Verify zero TypeScript errors
- [x] Verify no compilation warnings

### Task 5.5: Verify Zero-Any Policy
- [x] Execute `grep -r "any" Backend/src/users/domain/decorator/ --include="*.ts" --exclude-dir=node_modules`
- [x] Verify 0 matches (excluding comments)
- [x] Execute `grep -r ": any" Backend/src/messages/domain/decorator/__tests__/base-message.spec.ts`
- [x] Verify 0 matches

### Task 5.6: Verify English Language
- [x] Review all new files for Spanish identifiers
- [x] Verify all class names in English
- [x] Verify all method names in English
- [x] Verify all variable names in English
- [x] Verify all comments in English

---

## Phase 6: Acceptance Criteria Validation

### Task 6.1: Validate AC1
- [x] Open `base-message.spec.ts`
- [x] Confirm test exists: "should return JSON string with text property"
- [x] Confirm test validates only text field present
- [x] Mark AC1 as ✅ PASS

### Task 6.2: Validate AC2
- [x] Open `file-message.decorator.spec.ts`
- [x] Confirm test exists: "should include files in rendered JSON"
- [x] Confirm test validates files array structure
- [x] Mark AC2 as ✅ PASS

### Task 6.3: Validate AC3
- [x] Open `decorator-composition.spec.ts`
- [x] Confirm test exists: "should include both files and mentions in rendered JSON"
- [x] Confirm test validates File + Mention composition
- [x] Mark AC3 as ✅ PASS

### Task 6.4: Validate AC4
- [x] Open `base-message.spec.ts`
- [x] Confirm NEW test exists: "should NOT include decorator fields without decorators"
- [x] Confirm test validates `files`, `mentions`, `reactions` are undefined
- [x] Open `base-profile.spec.ts`
- [x] Confirm test exists: "should NOT include verified field"
- [x] Confirm test validates `verified`, `verifiedAt`, `verifiedBy` are undefined
- [x] Mark AC4 as ✅ PASS

### Task 6.5: Validate AC5
- [x] Count tests for BaseMessage: expect ≥2 (actual: 5)
- [x] Count tests for FileMessageDecorator: expect ≥2 (actual: 4)
- [x] Count tests for MentionMessageDecorator: expect ≥2 (actual: 4)
- [x] Count tests for ReactionMessageDecorator: expect ≥2 (actual: 4)
- [x] Count tests for BaseProfile: expect ≥2 (actual: 3)
- [x] Count tests for VerifiedProfileDecorator: expect ≥2 (actual: 3)
- [x] Mark AC5 as ✅ PASS

---

## Phase 7: Final Checklist

### Task 7.1: Code Quality
- [x] All files use TypeScript strict mode
- [x] Zero-Any policy maintained (0 `any` types)
- [x] All identifiers in English
- [x] All comments in English
- [x] Consistent naming conventions

### Task 7.2: Testing
- [x] All 26 tests pass
- [x] Test execution time <2 seconds total
- [x] No test warnings or deprecations
- [x] All AC1-AC5 validated

### Task 7.3: Build
- [x] `npm run build` succeeds
- [x] Zero TypeScript errors
- [x] Zero compilation warnings

### Task 7.4: Documentation
- [x] README.md created for profile decorators
- [x] UML diagram included
- [x] Usage examples provided

---

## Summary

**Total Tasks**: 47  
**Estimated Time**: ~1 hour  
**Files Created**: 10  
**Files Modified**: 1  
**Tests Added**: 7 (1 message + 6 profile)  
**Total Tests**: 26

### Files Created
1. `Backend/src/users/domain/decorator/interfaces/profile.interface.ts`
2. `Backend/src/users/domain/decorator/interfaces/index.ts`
3. `Backend/src/users/domain/decorator/base-profile.ts`
4. `Backend/src/users/domain/decorator/profile-decorator.abstract.ts`
5. `Backend/src/users/domain/decorator/verified-profile.decorator.ts`
6. `Backend/src/users/domain/decorator/index.ts`
7. `Backend/src/users/domain/decorator/__tests__/base-profile.spec.ts`
8. `Backend/src/users/domain/decorator/__tests__/verified-profile.decorator.spec.ts`
9. `Backend/src/users/domain/decorator/README.md`

### Files Modified
1. `Backend/src/messages/domain/decorator/__tests__/base-message.spec.ts` (add 1 test)

---

**Document Version**: 1.0  
**Created**: 27 de Abril, 2026  
**Status**: Ready for Implementation
