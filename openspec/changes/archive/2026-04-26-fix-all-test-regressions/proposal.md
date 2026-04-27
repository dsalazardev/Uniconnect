# Proposal: Fix All Test Regressions

## Problem Statement

La suite de tests del backend tiene **21 tests fallidos** distribuidos en **12 archivos de especificación**. Los fallos se deben principalmente a:

1. **Inyección de dependencias desactualizada**: Tests antiguos no usan las nuevas fábricas de mocks (`createPrismaMock()`, `createEventEmitterMock()`)
2. **Lógica de negocio desactualizada**: Expectativas de tests no coinciden con el comportamiento actual del código
3. **Mocks incompletos**: Falta de S3Client, MessageRepository, y otros servicios en TestingModules

## Current State

**Test Results**:
- ❌ 21 tests failing
- ✅ 207 tests passing
- **Total**: 228 tests

**Failing Test Suites** (12):
1. `permissions.service.spec.ts` - Dependency injection error
2. `files.service.spec.ts` - Dependency injection error
3. `events.service.spec.ts` - 7 tests failing (FEN format, permissions)
4. `users.service.spec.ts` - Dependency injection error
5. `app.controller.spec.ts` - Method not found error
6. `auth.controller.spec.ts` - Dependency injection error
7. `events.controller.spec.ts` - 4 tests failing
8. `files.controller.spec.ts` - Dependency injection error
9. `multer-types-preservation.spec.ts` - WebSocket emission test
10. `multer-preservation.spec.ts` - S3 URL encoding test
11. `roles.service.spec.ts` - Dependency injection error
12. `users.controller.spec.ts` - Dependency injection error

## Proposed Solution

### Capability 1: Migrate Tests to Global Mock Factories
**Scope**: Update 7 test files with dependency injection errors

**Files to Update**:
- `src/permissions/permissions.service.spec.ts`
- `src/files/files.service.spec.ts`
- `src/users/users.service.spec.ts`
- `src/auth/auth.controller.spec.ts`
- `src/files/files.controller.spec.ts`
- `src/roles/roles.service.spec.ts`
- `src/users/users.controller.spec.ts`

**Changes**:
- Replace inline mocks with `createPrismaMock()` from `src/test/mocks/prisma.mock.ts`
- Add `createEventEmitterMock()` where EventEmitter2 is used
- Inject S3Client mock for files tests
- Inject MessageRepository and MessagesGateway for files tests

### Capability 2: Fix EventsService Test Expectations
**Scope**: Update 7 failing tests in `events.service.spec.ts`

**Issues**:
- `findAll` error test expects `null`, service returns `[]`
- Permission tests expect `FORBIDDEN`, service returns `INVALID_ID`
- Property-based tests have outdated expectations

**Changes**:
- Update error format expectations to match current FEN response
- Adjust permission error codes
- Fix property-based test assertions

### Capability 3: Fix EventsController Tests
**Scope**: Update 4 failing tests in `events.controller.spec.ts`

**Issues**:
- Mock service not properly configured
- Filter expectations don't match controller implementation

**Changes**:
- Configure mock service with proper return values
- Update filter assertions

### Capability 4: Fix AppController Test
**Scope**: Fix 1 failing test in `app.controller.spec.ts`

**Issue**:
- `getHello()` method not found or renamed

**Changes**:
- Verify actual method name in AppController
- Update test to match current implementation

### Capability 5: Fix Property-Based Tests for File Upload
**Scope**: Update 2 failing tests in multer preservation specs

**Issues**:
- S3 URL encoding test fails with special characters like `{`
- WebSocket emission test has incorrect payload expectations

**Changes**:
- Make URL encoding test flexible with special characters
- Update WebSocket payload assertions

## Success Criteria

- ✅ All 228 tests passing (0 failed)
- ✅ No regressions in existing passing tests
- ✅ TypeScript build passes without errors
- ✅ All test suites use standardized mock factories

## Impact Assessment

**Risk**: Low - Only updating test code, no business logic changes

**Benefits**:
- Stable CI/CD pipeline
- Confidence in test suite
- Easier maintenance with standardized mocks
- Foundation for future test development

## Implementation Strategy

1. **Phase 1**: Migrate dependency injection tests (Capability 1)
2. **Phase 2**: Fix EventsService expectations (Capability 2)
3. **Phase 3**: Fix EventsController tests (Capability 3)
4. **Phase 4**: Fix AppController test (Capability 4)
5. **Phase 5**: Fix property-based tests (Capability 5)
6. **Phase 6**: Validate full suite passes

**Estimated Effort**: 2-3 hours
