# Requirements: US-T01 - Unit Tests for Decorator Pattern

## Overview

Implement comprehensive unit tests for the Decorator pattern covering both **message decorators** (existing) and **profile decorators** (new implementation required). This ensures that each decorator correctly adds its responsibility without breaking base behavior.

## Business Context

The Decorator pattern is used in two domains:
1. **Messages**: Enrich chat messages with files, mentions, and reactions
2. **Profiles**: Enrich user profiles with verification badges and additional metadata

Both implementations must be thoroughly tested to guarantee:
- Base classes work independently
- Decorators add their specific functionality
- Decorators can be composed without conflicts
- Absence of decorators doesn't pollute the output

## Acceptance Criteria

### AC1: BaseMessage renders only plain text
**Given** BaseMessage.render() is called  
**When** no decorators are applied  
**Then** the output contains only text property without extra metadata

**Validation**:
- `parsed.text` exists and equals input text
- No `files`, `mentions`, or `reactions` fields present

### AC2: FileMessageDecorator includes file fields
**Given** FileMessageDecorator wraps BaseMessage  
**When** render() is called  
**Then** the output includes files array with correct structure

**Validation**:
- `parsed.files` exists and contains file objects
- Each file has: `url`, `name`, `mimeType`, `size`

### AC3: Decorator composition works correctly
**Given** Multiple decorators are composed (File + Mention)  
**When** render() is called  
**Then** the output includes all decorator fields

**Validation**:
- `parsed.files` exists (from FileMessageDecorator)
- `parsed.mentions` exists (from MentionMessageDecorator)
- Base text is preserved

### AC4: Negative test - no decorator pollution
**Given** BaseMessage without any decorators  
**When** render() is called  
**Then** decorator-specific fields are undefined

**Validation**:
- `parsed.files` is undefined
- `parsed.mentions` is undefined
- `parsed.reactions` is undefined

### AC5: Minimum test coverage per class
**Given** Each class in the pattern (base + decorators)  
**When** test suite is executed  
**Then** each class has at least 2 test cases

**Validation**:
- BaseMessage: ≥2 tests
- FileMessageDecorator: ≥2 tests
- MentionMessageDecorator: ≥2 tests
- ReactionMessageDecorator: ≥2 tests
- BaseProfile: ≥2 tests (NEW)
- VerifiedProfileDecorator: ≥2 tests (NEW)

## Current State Analysis

### Message Decorators (Existing)
**Location**: `src/messages/domain/decorator/`

**Implemented Classes**:
- ✅ `BaseMessage` - Plain text messages
- ✅ `FileMessageDecorator` - Adds file attachments
- ✅ `MentionMessageDecorator` - Adds user mentions
- ✅ `ReactionMessageDecorator` - Adds emoji reactions

**Test Coverage**:
- ✅ AC1: Covered (4 tests for BaseMessage)
- ✅ AC2: Covered (4 tests for FileMessageDecorator)
- ✅ AC3: Covered (3 composition tests)
- ❌ AC4: **MISSING** - No negative test for field absence
- ✅ AC5: Covered (all classes have ≥2 tests)

**Gap**: AC4 requires 1 additional test in `base-message.spec.ts`

### Profile Decorators (NOT IMPLEMENTED)
**Location**: `src/users/domain/decorator/` (to be created)

**Required Classes**:
- ❌ `IProfile` interface
- ❌ `BaseProfile` - Basic user profile
- ❌ `VerifiedProfileDecorator` - Adds verification badge

**Test Coverage**: 0% (not implemented)

**Gap**: Complete implementation + tests required

## Technical Requirements

### Message Decorator Tests

#### 1. Add Negative Test (AC4)
**File**: `src/messages/domain/decorator/__tests__/base-message.spec.ts`

**New Test**:
```typescript
it('should NOT include decorator fields without decorators', () => {
  const rendered = message.render();
  const parsed = JSON.parse(rendered);
  expect(parsed.files).toBeUndefined();
  expect(parsed.mentions).toBeUndefined();
  expect(parsed.reactions).toBeUndefined();
});
```

### Profile Decorator Implementation

#### 2. Create Profile Domain Structure
**Directory**: `src/users/domain/decorator/`

**Files to Create**:
- `interfaces/profile.interface.ts` - IProfile interface
- `base-profile.ts` - Concrete base implementation
- `profile-decorator.abstract.ts` - Abstract decorator base
- `verified-profile.decorator.ts` - Verification badge decorator
- `README.md` - Pattern documentation

#### 3. IProfile Interface
```typescript
export interface IProfile {
  getBasicInfo(): { userId: number; username: string; email: string };
  getMetadata(): Record<string, unknown>;
  render(): string; // JSON string
}
```

#### 4. BaseProfile Implementation
```typescript
export class BaseProfile implements IProfile {
  constructor(
    private userId: number,
    private username: string,
    private email: string
  ) {}

  getBasicInfo() {
    return { userId: this.userId, username: this.username, email: this.email };
  }

  getMetadata() {
    return { createdAt: new Date().toISOString() };
  }

  render(): string {
    return JSON.stringify({
      userId: this.userId,
      username: this.username,
      email: this.email,
    });
  }
}
```

#### 5. VerifiedProfileDecorator
```typescript
export class VerifiedProfileDecorator implements IProfile {
  constructor(
    private profile: IProfile,
    private verifiedAt: Date,
    private verifiedBy: string
  ) {}

  getBasicInfo() {
    return this.profile.getBasicInfo();
  }

  getMetadata() {
    return this.profile.getMetadata();
  }

  render(): string {
    const baseData = JSON.parse(this.profile.render());
    return JSON.stringify({
      ...baseData,
      verified: true,
      verifiedAt: this.verifiedAt.toISOString(),
      verifiedBy: this.verifiedBy,
    });
  }
}
```

#### 6. Profile Decorator Tests
**Files to Create**:
- `__tests__/base-profile.spec.ts` - BaseProfile tests (≥2 tests)
- `__tests__/verified-profile.decorator.spec.ts` - Decorator tests (≥2 tests)

**Test Structure**:
```typescript
describe('BaseProfile', () => {
  it('should return basic info');
  it('should render JSON without verification fields');
  it('should NOT include verified field'); // Negative test
});

describe('VerifiedProfileDecorator', () => {
  it('should delegate basic info to wrapped profile');
  it('should include verified field in rendered JSON');
  it('should include verifiedAt timestamp');
});
```

## Non-Functional Requirements

### Code Quality
- ✅ **Zero-Any Policy**: No `any` types allowed
- ✅ **English Language**: All code, comments, and identifiers in English
- ✅ **TypeScript Strict Mode**: Full type safety

### Testing Standards
- ✅ **Jest Framework**: Use existing Jest configuration
- ✅ **Descriptive Names**: Test names clearly state what they validate
- ✅ **Arrange-Act-Assert**: Follow AAA pattern
- ✅ **Isolation**: Each test is independent

### Performance
- ✅ **Fast Execution**: All tests complete in <2 seconds
- ✅ **No External Dependencies**: Pure unit tests, no DB/API calls

## Success Criteria

### Test Execution
```bash
npm test -- decorator  # All message decorator tests pass
npm test -- profile    # All profile decorator tests pass
```

**Expected Output**:
- Message Decorators: 20 tests passing (19 existing + 1 new AC4)
- Profile Decorators: 6 tests passing (new implementation)
- **Total**: 26 tests passing
- **Time**: <2 seconds
- **Coverage**: 100% of AC1-AC5

### Verification Checklist
- [ ] AC1: BaseMessage renders only text ✅ (existing)
- [ ] AC2: FileDecorator includes files ✅ (existing)
- [ ] AC3: Composition works ✅ (existing)
- [ ] AC4: Negative test added ⚠️ (1 test to add)
- [ ] AC5: All classes have ≥2 tests ⚠️ (profile decorators to implement)
- [ ] Zero-Any policy maintained
- [ ] All tests pass
- [ ] Build succeeds

## Out of Scope

- ❌ Integration tests with database
- ❌ E2E tests with API endpoints
- ❌ Performance benchmarking
- ❌ Additional profile decorators beyond VerifiedProfileDecorator
- ❌ Frontend tests

## Dependencies

### Existing Code
- `src/messages/domain/decorator/` - Message decorator implementation (US-D01)
- Jest configuration in `Backend/jest.config.js`

### New Code Required
- `src/users/domain/decorator/` - Profile decorator implementation
- Test files for profile decorators

## Risks and Mitigations

### Risk 1: Profile decorator location
**Risk**: Uncertainty about correct location for profile decorators  
**Mitigation**: Use `src/users/domain/decorator/` following Clean Architecture

### Risk 2: Test execution time
**Risk**: Adding 6+ tests might slow down test suite  
**Mitigation**: Keep tests pure (no I/O), use beforeEach for setup

### Risk 3: Breaking existing tests
**Risk**: Adding AC4 test might reveal bugs in BaseMessage  
**Mitigation**: Review BaseMessage.render() implementation before adding test

## Acceptance Process

1. **Code Review**: All new code follows project conventions
2. **Test Execution**: `npm test` passes with 26 decorator tests
3. **Build Verification**: `npm run build` succeeds
4. **Zero-Any Check**: `grep -r "any" src/users/domain/decorator/` returns 0 matches
5. **Documentation**: README.md created for profile decorators

## Estimated Effort

- Add AC4 test: **5 minutes**
- Implement profile decorators: **30 minutes**
- Write profile tests: **20 minutes**
- Documentation: **10 minutes**
- **Total**: ~1 hour

---

**Document Version**: 1.0  
**Created**: 27 de Abril, 2026  
**Status**: Ready for Implementation
