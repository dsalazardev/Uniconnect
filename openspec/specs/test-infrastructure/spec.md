# test-infrastructure Specification

## Purpose
TBD - created by archiving change fix-backend-tests-mocks. Update Purpose after archive.
## Requirements
### Requirement: MessagesService tests SHALL have PrismaService mock

The `messages.service.spec.ts` test file SHALL provide a mock for `PrismaService` using the existing `createPrismaMock()` helper to resolve NestJS dependency injection.

#### Scenario: PrismaService mock is provided in TestingModule
- **WHEN** the test module is created in `beforeEach()`
- **THEN** the providers array SHALL include `{ provide: PrismaService, useValue: prismaMock }`
- **AND** `prismaMock` SHALL be created using `createPrismaMock()` from `../test/mocks/prisma.mock`

#### Scenario: All 9 MessagesService tests pass
- **WHEN** `npm test -- messages.service.spec.ts` is executed
- **THEN** all 9 tests SHALL pass without dependency resolution errors
- **AND** no `Nest can't resolve dependencies` errors SHALL occur

### Requirement: MessagesController tests SHALL validate all method parameters

The `messages.controller.spec.ts` test file SHALL validate method calls with all parameters including optional ones set to `undefined` when not provided.

#### Scenario: findRecentByGroup expectation includes optional beforeId parameter
- **WHEN** testing `controller.findRecentByGroup(1, 50)` call
- **THEN** the test expectation SHALL be `expect(service.findRecentByGroup).toHaveBeenCalledWith(1, 50, undefined)`
- **AND** the test SHALL pass without "received (1, 50, undefined)" errors

#### Scenario: MessagesController test passes
- **WHEN** `npm test -- messages.controller.spec.ts` is executed
- **THEN** the `findRecentByGroup` test SHALL pass
- **AND** the expectation SHALL match the actual controller method signature

### Requirement: FilesController tests SHALL have S3Client and ConfigService mocks

The `files.controller.spec.ts` test file SHALL provide mocks for `S3Client` and `ConfigService` to resolve NestJS dependency injection for `FilesService`.

#### Scenario: S3Client mock is provided in TestingModule
- **WHEN** the test module is created in `beforeEach()`
- **THEN** the providers array SHALL include `{ provide: S3Client, useValue: mockS3Client }`
- **AND** `mockS3Client` SHALL have a `send` method that returns a resolved promise

#### Scenario: ConfigService mock is provided in TestingModule
- **WHEN** the test module is created in `beforeEach()`
- **THEN** the providers array SHALL include `{ provide: ConfigService, useValue: mockConfigService }`
- **AND** `mockConfigService.get()` SHALL return `'test-bucket'` for `'AWS_S3_BUCKET_NAME'`
- **AND** `mockConfigService.get()` SHALL return `'us-east-1'` for `'AWS_REGION'`
- **AND** `mockConfigService.get()` SHALL return `null` for unknown keys

#### Scenario: All FilesController tests pass
- **WHEN** `npm test -- files.controller.spec.ts` is executed
- **THEN** all tests SHALL pass without dependency resolution errors
- **AND** no `Nest can't resolve dependencies` errors SHALL occur

### Requirement: All backend tests SHALL pass

After applying the fixes, the entire backend test suite SHALL pass without failures.

#### Scenario: Full test suite passes
- **WHEN** `npm test` is executed in the Backend directory
- **THEN** all 316 tests SHALL pass
- **AND** zero tests SHALL fail
- **AND** the test summary SHALL show "Tests: 316 passed, 316 total"

#### Scenario: Only spec files are modified
- **WHEN** reviewing the git diff
- **THEN** only files matching `*.spec.ts` pattern SHALL be modified
- **AND** no service, controller, or business logic files SHALL be changed
- **AND** no backend API responses SHALL be altered

### Requirement: Mocks SHALL follow strict TypeScript typing

All mock implementations SHALL follow the AGENTS.md Zero-any policy and use strict TypeScript typing.

#### Scenario: PrismaService mock has proper typing
- **WHEN** using `createPrismaMock()` helper
- **THEN** the return type SHALL be `ReturnType<typeof createPrismaMock>`
- **AND** no `any` types SHALL be used in the mock configuration

#### Scenario: S3Client mock has proper typing
- **WHEN** defining `mockS3Client`
- **THEN** the `send` method SHALL be typed as `jest.fn().mockResolvedValue({})`
- **AND** no `any` types SHALL be used in the mock configuration

#### Scenario: ConfigService mock has proper typing
- **WHEN** defining `mockConfigService`
- **THEN** the `get` method SHALL accept `key: string` parameter
- **AND** the return type SHALL be inferred from the implementation
- **AND** no `any` types SHALL be used in the mock configuration

