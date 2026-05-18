## ADDED Requirements

### Requirement: Zod schemas for Sprint 4 entities in shared package
The system SHALL publish Zod schemas in `@uniconnect/shared` for all Sprint 4 entity types: Resource, ForumQuestion, ForumAnswer, Poll, PollOption, StudySessionInstance, SessionAttendance, and their corresponding DTOs.

#### Scenario: Resource schema validates correct structure
- **WHEN** a Zod schema for Resource is created with valid fields (id_resource, id_program, titulo, tipo_contenido, created_at, updated_at)
- **THEN** the schema parses successfully

#### Scenario: ForumQuestion schema validates correct structure
- **WHEN** a Zod schema for ForumQuestion is created with valid fields (id, subjectId, authorId, authorName, title, body, status, voteCount, answerCount, createdAt)
- **THEN** the schema parses successfully

#### Scenario: ForumAnswer schema validates correct structure
- **WHEN** a Zod schema for ForumAnswer is created with valid fields (id, questionId, authorId, authorName, body, voteCount, isAccepted, createdAt)
- **THEN** the schema parses successfully

#### Scenario: Poll schema validates correct structure
- **WHEN** a Zod schema for Poll is created with valid fields (id, groupId, createdBy, question, options, closesAt, status, createdAt)
- **THEN** the schema parses successfully

#### Scenario: StudySessionInstance schema validates correct structure
- **WHEN** a Zod schema for StudySessionInstance is created with valid fields (id_instance, id_session, title, scheduled_date, duration_minutes, is_recurring, status, created_by, attendance_count, my_attendance)
- **THEN** the schema parses successfully

#### Scenario: CreateResourcePayloadSchema validates optional fields
- **WHEN** a DTO schema with optional url_externa, titulo, descripcion, etiquetas fields is validated
- **THEN** the schema parses with all fields optionally omitted

#### Scenario: Invalid data is rejected by Zod schemas
- **WHEN** data with missing required fields or wrong types is validated against a Sprint 4 Zod schema
- **THEN** the schema returns a ZodError with descriptive messages

### Requirement: Types derived from Zod schemas via z.infer
The system MUST derive TypeScript interfaces from Zod schemas using `z.infer<typeof Schema>` for all Sprint 4 entities in the shared package. Hand-written type interfaces SHALL be replaced with derived types.

#### Scenario: Type changes propagate when schema changes
- **WHEN** a Zod schema field is renamed (e.g., `titulo` → `title`)
- **THEN** the derived type changes automatically, and any consumer using the old field name fails TypeScript compilation

#### Scenario: Backward compatibility is enforced
- **WHEN** a Zod schema field type changes (e.g., `number` → `string`)
- **THEN** the derived type changes and TypeScript compilation fails in all files consuming the old type

### Requirement: Integration tests for every Sprint 4 endpoint
The system SHALL have at least one integration test per Sprint 4 endpoint that validates the HTTP response contract against the corresponding Zod schema.

#### Scenario: All 7 forum endpoints have a passing integration test
- **WHEN** the forum e2e test suite is executed
- **THEN** each of the 7 forum endpoints has at least one test that returns the expected status code and validates the response body against its Zod schema

#### Scenario: All 8 biblioteca endpoints have a passing integration test
- **WHEN** the biblioteca e2e test suite is executed
- **THEN** each of the 8 biblioteca endpoints has at least one test that returns the expected status code and validates the response body against its Zod schema

#### Scenario: All 4 study session endpoints have a passing integration test
- **WHEN** the study sessions e2e test suite is executed
- **THEN** each of the 4 study session endpoints has at least one test that returns the expected status code and validates the response body against its Zod schema

#### Scenario: All 3 poll endpoints have a passing integration test
- **WHEN** the polls e2e test suite is executed
- **THEN** each of the 3 poll endpoints has at least one test that returns the expected status code and validates the response body against its Zod schema

#### Scenario: Error cases are tested for each module
- **WHEN** invalid input is sent to a Sprint 4 endpoint (e.g., missing required fields, invalid enum values)
- **THEN** the test verifies the correct HTTP error status code (400, 403, 404, 409) and error response structure

### Requirement: StudySessionsService exists in shared package
The shared package SHALL export a `StudySessionsService` class with methods for all 4 study session endpoints, following the existing DI pattern (constructor receives `AxiosInstance`).

#### Scenario: StudySessionsService is exported from @uniconnect/shared
- **WHEN** the shared package barrel export is inspected
- **THEN** `StudySessionsService` is listed among the exported services

#### Scenario: All 4 study session methods are callable
- **WHEN** a StudySessionsService instance is created with a mock AxiosInstance
- **THEN** methods `createSession`, `getSessions`, `cancelInstance`, `updateAttendance` are all defined and callable

### Requirement: Endpoint constants for study sessions exist in shared
The shared package SHALL export `STUDY_SESSION_ENDPOINTS` constants for all 4 study session routes.

#### Scenario: Study session endpoint constants resolve to correct paths
- **WHEN** `STUDY_SESSION_ENDPOINTS.CREATE(1)` is evaluated
- **THEN** it returns `/groups/1/study-sessions`
