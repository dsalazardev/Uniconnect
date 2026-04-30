# Design: Fix Backend Tests Mocks

## Context

The Uniconnect backend has 316 unit tests, of which 13 are failing due to incomplete mock configurations in Jest. The failures are isolated to 3 test suites in the Messages and Files modules. The production code is correct and the frontend works perfectly - this is purely a testing infrastructure issue.

**Current State:**
- `messages.service.spec.ts`: Missing `PrismaService` mock (9 tests failing)
- `messages.controller.spec.ts`: Incorrect test expectation for optional parameter (1 test failing)
- `files.controller.spec.ts`: Missing `S3Client` and `ConfigService` mocks (3 tests failing)

**Constraints:**
- AGENTS.md mandates Zero-any policy and strict typing
- Cannot modify business logic or controller/service files
- Must use existing mock helpers from `src/test/mocks/`
- Must maintain compatibility with frontend (no breaking changes)

## Goals / Non-Goals

**Goals:**
- Fix all 13 failing tests by updating only `.spec.ts` files
- Use existing mock patterns and helpers (`createPrismaMock()`)
- Achieve 316/316 tests passing
- Maintain strict TypeScript typing (zero `any`)

**Non-Goals:**
- Refactoring business logic or service implementations
- Creating new mock helpers (reuse existing ones)
- Modifying backend API responses or contracts
- Changing test framework or configuration

## Decisions

### Decision 1: Use Existing `createPrismaMock()` Helper

**Rationale:** The project already has a standardized Prisma mock factory at `src/test/mocks/prisma.mock.ts` that provides type-safe mocks for all Prisma models. This ensures consistency across all test files.

**Alternative Considered:** Creating inline mocks in each test file
**Why Rejected:** Violates DRY principle and increases maintenance burden

**Implementation:**
```typescript
import { createPrismaMock } from '../test/mocks/prisma.mock';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = createPrismaMock();
// ... in providers array:
{ provide: PrismaService, useValue: prismaMock }
```

### Decision 2: Follow S3Client Mock Pattern from `files.service.spec.ts`

**Rationale:** The `files.service.spec.ts` already has a working S3Client mock pattern that we can reuse. This ensures consistency and avoids reinventing the wheel.

**Pattern:**
```typescript
const mockS3Client = {
  send: jest.fn().mockResolvedValue({}),
};
```

**Why This Works:** The S3Client from AWS SDK v3 uses a `.send()` method for all operations, so mocking this single method covers all use cases.

### Decision 3: Include Optional Parameters in Test Expectations

**Rationale:** When a controller method has optional parameters, Jest's `toHaveBeenCalledWith()` matcher validates ALL arguments passed, including `undefined` for optional ones. The test must reflect the actual method signature.

**Example:**
```typescript
// Controller signature: findRecentByGroup(id_group, limit?, beforeId?)
// Controller call: this.service.findRecentByGroup(id_group, limit || 50, beforeId)
// Test expectation must be:
expect(service.findRecentByGroup).toHaveBeenCalledWith(1, 50, undefined);
```

### Decision 4: Mock ConfigService for FilesService Dependencies

**Rationale:** `FilesService` constructor reads AWS configuration from `ConfigService`. Without mocking it, the service initialization fails.

**Implementation:**
```typescript
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
    if (key === 'AWS_REGION') return 'us-east-1';
    return null;
  }),
};
```

## Risks / Trade-offs

### Risk 1: Mock Drift from Real Implementation
**Risk:** If `PrismaService` or `S3Client` APIs change, mocks may become outdated
**Mitigation:** Use the existing `createPrismaMock()` helper which is centrally maintained. For S3Client, the `.send()` method is stable in AWS SDK v3.

### Risk 2: False Positives in Tests
**Risk:** Mocks might pass tests even if real implementation would fail
**Mitigation:** This change only fixes existing tests - integration tests and E2E tests still validate real behavior. Unit tests are meant to test logic in isolation.

### Risk 3: Incomplete ConfigService Mock
**Risk:** If `FilesService` starts reading additional config keys, the mock may need updates
**Mitigation:** The mock returns `null` for unknown keys, which matches the real `ConfigService` behavior for missing env vars. Tests will fail explicitly if new required keys are added.

## Migration Plan

**Deployment Steps:**
1. Apply changes to 3 `.spec.ts` files
2. Run `npm test` to verify all 316 tests pass
3. Commit changes with message: "fix: resolve 13 failing tests in Messages and Files modules"

**Rollback Strategy:**
- If tests still fail, revert the 3 file changes
- No production impact since only test files are modified

**Validation:**
- Pre-deployment: 303/316 tests passing (13 failing)
- Post-deployment: 316/316 tests passing (0 failing)
- No changes to backend API responses or frontend behavior

## Open Questions

None - the solution is straightforward and follows established patterns in the codebase.
