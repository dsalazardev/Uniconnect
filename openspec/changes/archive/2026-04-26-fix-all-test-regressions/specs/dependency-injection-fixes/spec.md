# Spec: Dependency Injection Fixes

## Capability

Migrate 7 test files to use global mock factories, resolving "Nest can't resolve dependencies" errors.

## Requirements

### REQ-1: Migrate PermissionsService Test
**File**: `src/permissions/permissions.service.spec.ts`

**Current Issue**: Dependency injection error with TypeORM repositories

**Changes**:
- Import `createPrismaMock()` (if needed for future migrations)
- Mock TypeORM repositories: `Repository<AccessEntity>`, `Repository<PermissionEntity>`
- Use `getRepositoryToken()` from `@nestjs/typeorm`

**Acceptance**:
- Test "should be defined" passes
- No dependency injection errors

### REQ-2: Migrate FilesService Test
**File**: `src/files/files.service.spec.ts`

**Current Issue**: Missing S3Client, MessageRepository, MessagesGateway

**Changes**:
- Import `createPrismaMock()`
- Add S3Client mock: `{ send: jest.fn() }`
- Add MessageRepository mock with `createWithFiles` method
- Add MessagesGateway mock with `emitMessageWithFiles` method

**Acceptance**:
- Test "should be defined" passes
- All dependencies resolved

### REQ-3: Migrate UsersService Test
**File**: `src/users/users.service.spec.ts`

**Current Issue**: Dependency injection error

**Changes**:
- Import `createPrismaMock()`
- Replace inline Prisma mock with factory
- Add EventEmitter2 mock if needed

**Acceptance**:
- Test "should be defined" passes

### REQ-4: Migrate AuthController Test
**File**: `src/auth/auth.controller.spec.ts`

**Current Issue**: Dependency injection error with AuthService

**Changes**:
- Mock AuthService with all required methods
- Mock JwtService
- Mock ConfigService

**Acceptance**:
- Test "should be defined" passes

### REQ-5: Migrate FilesController Test
**File**: `src/files/files.controller.spec.ts`

**Current Issue**: Missing FilesService dependencies

**Changes**:
- Mock FilesService with all methods
- Ensure proper dependency chain

**Acceptance**:
- Test "should be defined" passes

### REQ-6: Migrate RolesService Test
**File**: `src/roles/roles.service.spec.ts`

**Current Issue**: TypeORM repository not resolved

**Changes**:
- Mock `Repository<RoleEntity>` with `getRepositoryToken(RoleEntity)`
- Add all required repository methods

**Acceptance**:
- Test "should be defined" passes

### REQ-7: Migrate UsersController Test
**File**: `src/users/users.controller.spec.ts`

**Current Issue**: Dependency injection error

**Changes**:
- Mock UsersService with all methods
- Ensure proper dependency chain

**Acceptance**:
- Test "should be defined" passes

## Test Scenarios

### Scenario 1: PermissionsService Instantiation
**Given**: Test module with mocked repositories  
**When**: Service is instantiated  
**Then**: Service is defined without errors

### Scenario 2: FilesService with S3
**Given**: Test module with S3Client, MessageRepository, MessagesGateway  
**When**: Service is instantiated  
**Then**: Service is defined and can call S3 operations

### Scenario 3: All Services Instantiate
**Given**: All 7 test files updated  
**When**: Tests are executed  
**Then**: All "should be defined" tests pass

## Implementation Notes

- Use `getRepositoryToken()` for TypeORM entities
- S3Client mock should have `send` method returning Promise
- MessageRepository mock needs `createWithFiles` method
- MessagesGateway mock needs `emitMessageWithFiles` method
- Keep existing test logic unchanged, only fix setup
