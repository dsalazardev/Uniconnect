# Proposal: Fix Backend Tests Mocks

## Problem Statement

13 tests are failing in 3 test suites (`messages.service.spec.ts`, `messages.controller.spec.ts`, `files.controller.spec.ts`) due to missing or incorrect mock configurations in Jest. The backend logic is correct and the frontend works perfectly - this is purely a testing infrastructure issue.

### Current Failures

1. **messages.service.spec.ts** (9 tests failing)
   - Error: `Nest can't resolve dependencies of the MessagesService (MessageRepository, EventEmitter, ?). Please make sure that the argument PrismaService at index [2] is available`
   - Root cause: `MessagesService` constructor injects `PrismaService` but the test doesn't provide a mock

2. **messages.controller.spec.ts** (1 test failing)
   - Error: `expect(service.findRecentByGroup).toHaveBeenCalledWith(1, 50)` but received `(1, 50, undefined)`
   - Root cause: Controller passes 3 arguments (including optional `beforeId`), test only validates 2

3. **files.controller.spec.ts** (3 tests failing)
   - Error: `Nest can't resolve dependencies of the FilesService (?). Please make sure that the argument S3Client at index [3] is available`
   - Root cause: `FilesService` injects `S3Client` and `ConfigService` but the controller test doesn't provide mocks

## Proposed Solution

Fix all 13 tests by updating **only** the `.spec.ts` files with proper mocks, following the project's existing patterns:

1. Use `createPrismaMock()` helper (already exists in `src/test/mocks/prisma.mock.ts`)
2. Use S3Client mock pattern from `files.service.spec.ts`
3. Update test expectations to match actual method signatures

**Zero changes to business logic** - only test infrastructure fixes.

## Success Criteria

- All 13 failing tests pass
- Total test count: 316/316 passing
- No modifications to any files outside `*.spec.ts`
- No breaking changes to backend responses
- Follows AGENTS.md rules: Zero-any policy, strict typing

## Impact

- **Risk**: 🟢 Zero - only test files modified
- **Scope**: 3 files, ~20 lines of code
- **Dependencies**: None - uses existing mock helpers
