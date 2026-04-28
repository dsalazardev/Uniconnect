# Design: US-T01 - Unit Tests for Decorator Pattern

## Architecture Overview

This US completes the testing layer for the Decorator pattern across two domains:
1. **Messages** (existing) - Add missing AC4 negative test
2. **Profiles** (new) - Implement minimal decorator + comprehensive tests

```
Backend/src/
├── messages/domain/decorator/          # Existing - Add 1 test
│   ├── __tests__/
│   │   └── base-message.spec.ts       # ← Add AC4 negative test
│   └── [existing implementation]
│
└── users/domain/decorator/             # NEW - Complete implementation
    ├── interfaces/
    │   ├── profile.interface.ts        # IProfile interface
    │   └── index.ts
    ├── base-profile.ts                 # Concrete base class
    ├── profile-decorator.abstract.ts   # Abstract decorator
    ├── verified-profile.decorator.ts   # Verification badge decorator
    ├── README.md                        # Pattern documentation
    └── __tests__/
        ├── base-profile.spec.ts        # BaseProfile tests (≥2)
        └── verified-profile.decorator.spec.ts  # Decorator tests (≥2)
```

## Design Decisions

### Decision 1: Minimal Profile Decorator Implementation

**Context**: US description mentions "decoradores de perfil" but no implementation exists.

**Options Considered**:
1. Skip profile decorators (violates US description)
2. Implement full profile system with multiple decorators
3. **Implement minimal viable decorator (1 decorator + tests)**

**Decision**: Option 3 - Minimal implementation

**Rationale**:
- Fulfills US description requirement
- Demonstrates pattern applicability to profiles
- Keeps scope manageable (~1 hour)
- Provides foundation for future profile decorators

**Trade-offs**:
- ✅ Fast implementation
- ✅ Proves pattern works for profiles
- ⚠️ Only 1 profile decorator (vs 3 message decorators)
- ⚠️ Not integrated with existing user system

### Decision 2: Profile Decorator Location

**Options**:
1. `src/users/decorators/` (alongside auth decorators)
2. `src/users/domain/decorator/` (Clean Architecture)
3. `src/profiles/domain/decorator/` (new module)

**Decision**: Option 2 - `src/users/domain/decorator/`

**Rationale**:
- Follows Clean Architecture (domain layer)
- Consistent with message decorators location
- No need for new module (users module exists)
- Clear separation from NestJS decorators

### Decision 3: Profile Decorator Functionality

**Options**:
1. PremiumProfileDecorator (adds premium badge)
2. VerifiedProfileDecorator (adds verification badge)
3. RoleProfileDecorator (adds role information)

**Decision**: Option 2 - VerifiedProfileDecorator

**Rationale**:
- Simple and clear responsibility
- Analogous to "verified" badges in social platforms
- Easy to test (boolean + timestamp)
- Doesn't require complex business logic

## Component Design

### 1. IProfile Interface

**Purpose**: Define contract for profile objects

**Methods**:
```typescript
interface IProfile {
  getBasicInfo(): { userId: number; username: string; email: string };
  getMetadata(): Record<string, unknown>;
  render(): string; // JSON string
}
```

**Design Notes**:
- `getBasicInfo()`: Returns core user data (immutable)
- `getMetadata()`: Returns additional metadata (extensible)
- `render()`: Serializes to JSON (decorator pattern entry point)

### 2. BaseProfile Class

**Purpose**: Concrete implementation of IProfile

**Responsibilities**:
- Store basic user information
- Render JSON with only basic fields
- Provide metadata (creation timestamp)

**Implementation**:
```typescript
export class BaseProfile implements IProfile {
  constructor(
    private readonly userId: number,
    private readonly username: string,
    private readonly email: string,
  ) {}

  getBasicInfo() {
    return {
      userId: this.userId,
      username: this.username,
      email: this.email,
    };
  }

  getMetadata() {
    return {
      createdAt: new Date().toISOString(),
    };
  }

  render(): string {
    const { userId, username, email } = this.getBasicInfo();
    return JSON.stringify({ userId, username, email });
  }
}
```

**Design Notes**:
- Immutable fields (readonly)
- No verification fields in base implementation
- Simple JSON serialization

### 3. ProfileDecorator Abstract Class

**Purpose**: Base class for all profile decorators

**Responsibilities**:
- Hold reference to wrapped profile
- Delegate getBasicInfo() and getMetadata()
- Force subclasses to implement render()

**Implementation**:
```typescript
export abstract class ProfileDecorator implements IProfile {
  constructor(protected readonly profile: IProfile) {}

  getBasicInfo() {
    return this.profile.getBasicInfo();
  }

  getMetadata() {
    return this.profile.getMetadata();
  }

  abstract render(): string;
}
```

**Design Notes**:
- Protected field for subclass access
- Delegation pattern for basic methods
- Abstract render() forces customization

### 4. VerifiedProfileDecorator Class

**Purpose**: Add verification badge to profiles

**Responsibilities**:
- Wrap existing profile
- Add `verified`, `verifiedAt`, `verifiedBy` fields
- Preserve base profile data

**Implementation**:
```typescript
export class VerifiedProfileDecorator extends ProfileDecorator {
  constructor(
    profile: IProfile,
    private readonly verifiedAt: Date,
    private readonly verifiedBy: string,
  ) {
    super(profile);
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

**Design Notes**:
- Extends ProfileDecorator (inherits delegation)
- Immutable verification data
- Spreads base data + adds verification fields

## Test Design

### Message Decorator Tests (Existing + AC4)

#### AC4 Negative Test

**File**: `base-message.spec.ts`

**Test Case**:
```typescript
describe('render', () => {
  // ... existing tests ...

  it('should NOT include decorator fields without decorators', () => {
    const rendered = message.render();
    const parsed = JSON.parse(rendered);
    
    // Positive assertions
    expect(parsed.text).toBe(textContent);
    
    // Negative assertions (AC4)
    expect(parsed.files).toBeUndefined();
    expect(parsed.mentions).toBeUndefined();
    expect(parsed.reactions).toBeUndefined();
  });
});
```

**Purpose**: Validate that BaseMessage doesn't pollute output with decorator fields

### Profile Decorator Tests (New)

#### BaseProfile Tests

**File**: `base-profile.spec.ts`

**Test Cases** (≥2 required):
```typescript
describe('BaseProfile', () => {
  const userId = 1;
  const username = 'johndoe';
  const email = 'john@example.com';
  let profile: BaseProfile;

  beforeEach(() => {
    profile = new BaseProfile(userId, username, email);
  });

  describe('getBasicInfo', () => {
    it('should return userId, username, and email', () => {
      const info = profile.getBasicInfo();
      expect(info.userId).toBe(userId);
      expect(info.username).toBe(username);
      expect(info.email).toBe(email);
    });
  });

  describe('render', () => {
    it('should return JSON with basic fields only', () => {
      const rendered = profile.render();
      const parsed = JSON.parse(rendered);
      expect(parsed.userId).toBe(userId);
      expect(parsed.username).toBe(username);
      expect(parsed.email).toBe(email);
    });

    it('should NOT include verified field', () => {
      const rendered = profile.render();
      const parsed = JSON.parse(rendered);
      expect(parsed.verified).toBeUndefined();
      expect(parsed.verifiedAt).toBeUndefined();
      expect(parsed.verifiedBy).toBeUndefined();
    });
  });
});
```

**Coverage**: 3 tests (exceeds AC5 requirement of ≥2)

#### VerifiedProfileDecorator Tests

**File**: `verified-profile.decorator.spec.ts`

**Test Cases** (≥2 required):
```typescript
describe('VerifiedProfileDecorator', () => {
  const userId = 1;
  const username = 'johndoe';
  const email = 'john@example.com';
  const verifiedAt = new Date('2026-04-27T12:00:00Z');
  const verifiedBy = 'admin@example.com';

  let baseProfile: BaseProfile;
  let decoratedProfile: VerifiedProfileDecorator;

  beforeEach(() => {
    baseProfile = new BaseProfile(userId, username, email);
    decoratedProfile = new VerifiedProfileDecorator(
      baseProfile,
      verifiedAt,
      verifiedBy,
    );
  });

  describe('getBasicInfo', () => {
    it('should delegate to wrapped profile', () => {
      const info = decoratedProfile.getBasicInfo();
      expect(info.userId).toBe(userId);
      expect(info.username).toBe(username);
      expect(info.email).toBe(email);
    });
  });

  describe('render', () => {
    it('should include verified field in JSON', () => {
      const rendered = decoratedProfile.render();
      const parsed = JSON.parse(rendered);
      expect(parsed.verified).toBe(true);
      expect(parsed.verifiedAt).toBe(verifiedAt.toISOString());
      expect(parsed.verifiedBy).toBe(verifiedBy);
    });

    it('should preserve base profile fields', () => {
      const rendered = decoratedProfile.render();
      const parsed = JSON.parse(rendered);
      expect(parsed.userId).toBe(userId);
      expect(parsed.username).toBe(username);
      expect(parsed.email).toBe(email);
    });
  });
});
```

**Coverage**: 3 tests (exceeds AC5 requirement of ≥2)

## Data Flow

### Message Decorator (Existing)
```
User Input → BaseMessage → FileMessageDecorator → MentionMessageDecorator
                ↓                ↓                      ↓
            {text}      {text, files}      {text, files, mentions}
```

### Profile Decorator (New)
```
User Data → BaseProfile → VerifiedProfileDecorator
              ↓                    ↓
    {userId, username,    {userId, username, email,
     email}                verified, verifiedAt, verifiedBy}
```

## Testing Strategy

### Test Pyramid

```
                    ▲
                   / \
                  /   \
                 /  E2E \          ← Out of scope
                /_______\
               /         \
              / Integration\       ← Out of scope
             /___________\
            /             \
           /  Unit Tests   \      ← THIS US (26 tests)
          /_________________\
```

### Test Coverage Matrix

| Class | AC1 | AC2 | AC3 | AC4 | AC5 | Total Tests |
|-------|-----|-----|-----|-----|-----|-------------|
| BaseMessage | ✅ | - | - | ⚠️ | ✅ | 4 → 5 |
| FileMessageDecorator | - | ✅ | ✅ | - | ✅ | 4 |
| MentionMessageDecorator | - | - | ✅ | - | ✅ | 4 |
| ReactionMessageDecorator | - | - | ✅ | - | ✅ | 4 |
| BaseProfile | ✅ | - | - | ✅ | ✅ | 3 (NEW) |
| VerifiedProfileDecorator | - | ✅ | - | - | ✅ | 3 (NEW) |

**Total**: 26 tests (20 existing + 1 AC4 + 6 profile)

## Non-Functional Design

### Performance
- **Target**: All 26 tests complete in <2 seconds
- **Strategy**: Pure unit tests, no I/O, minimal object creation

### Maintainability
- **Naming**: Descriptive test names following "should [expected behavior]" pattern
- **Structure**: AAA pattern (Arrange-Act-Assert)
- **Isolation**: Each test independent, use beforeEach for setup

### Type Safety
- **Zero-Any**: All types explicitly defined
- **Strict Mode**: TypeScript strict mode enabled
- **Interfaces**: IProfile interface enforces contract

## Integration Points

### Existing Code
- ✅ Message decorators in `src/messages/domain/decorator/`
- ✅ Jest configuration in `Backend/jest.config.js`
- ✅ User entity in `src/users/` (not directly used)

### Future Extensions
- 🔮 PremiumProfileDecorator (adds premium badge)
- 🔮 RoleProfileDecorator (adds role information)
- 🔮 Integration with UsersService
- 🔮 Profile decorator composition tests

## Risk Mitigation

### Risk 1: BaseMessage.render() might already include decorator fields
**Mitigation**: Review implementation before adding AC4 test

### Risk 2: Profile decorator location might conflict with auth decorators
**Mitigation**: Use `domain/decorator/` subdirectory for clear separation

### Risk 3: Test execution time might increase
**Mitigation**: Keep tests pure, use beforeEach, avoid async operations

## Success Metrics

- ✅ All 26 tests pass
- ✅ Test execution time <2 seconds
- ✅ Zero-Any policy maintained (0 `any` types)
- ✅ Build succeeds without errors
- ✅ All 5 AC criteria met

---

**Document Version**: 1.0  
**Created**: 27 de Abril, 2026  
**Status**: Ready for Implementation
