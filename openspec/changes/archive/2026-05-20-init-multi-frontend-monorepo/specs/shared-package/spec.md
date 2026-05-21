## ADDED Requirements

### Requirement: Platform-agnostic package structure
The system SHALL provide a shared package with zero dependencies on React Native, Expo, or React DOM.

#### Scenario: No React Native dependencies
- **WHEN** shared/package.json is inspected
- **THEN** it SHALL NOT contain react-native in dependencies or devDependencies

#### Scenario: No Expo dependencies
- **WHEN** shared/package.json is inspected
- **THEN** it SHALL NOT contain any @expo/* packages in dependencies or devDependencies

#### Scenario: No React dependencies
- **WHEN** shared/package.json is inspected
- **THEN** it SHALL NOT contain react or react-dom in dependencies

### Requirement: Types and DTOs organization
The system SHALL organize all TypeScript types and DTOs in dedicated types directory.

#### Scenario: Common types available
- **WHEN** code imports from @uniconnect/shared
- **THEN** FENResponse, PaginationMetadata, and ErrorDetails types SHALL be available

#### Scenario: Domain types available
- **WHEN** code imports from @uniconnect/shared
- **THEN** Event, User, Group, Message, Notification, Connection, Course, Program, and Student types SHALL be available

#### Scenario: Types exported via barrel
- **WHEN** code imports types
- **THEN** all types SHALL be re-exported from shared/src/types/index.ts

### Requirement: API endpoints centralization
The system SHALL centralize all API endpoint definitions as string constants.

#### Scenario: Endpoints organized by domain
- **WHEN** shared/src/api/endpoints/ is inspected
- **THEN** it SHALL contain separate files for events, groups, messages, notifications, connections, courses, programs, students, and auth

#### Scenario: Endpoints are string constants
- **WHEN** endpoint file is inspected
- **THEN** all endpoints SHALL be exported as const string values

#### Scenario: Endpoints exported via barrel
- **WHEN** code imports endpoints
- **THEN** all endpoint constants SHALL be re-exported from shared/src/api/endpoints/index.ts

### Requirement: HTTP client factory
The system SHALL provide Axios client factory function that accepts configuration and returns configured AxiosInstance.

#### Scenario: Factory accepts configuration
- **WHEN** createApiClient is called with baseURL
- **THEN** it SHALL return AxiosInstance configured with that baseURL

#### Scenario: Factory includes FEN interceptors
- **WHEN** createApiClient returns instance
- **THEN** response interceptor SHALL validate FENResponse format

#### Scenario: Factory includes token refresh mutex
- **WHEN** multiple 401 responses occur simultaneously
- **THEN** only one token refresh request SHALL be made

### Requirement: Service layer with dependency injection
The system SHALL provide service classes that accept AxiosInstance via constructor.

#### Scenario: Service accepts HTTP client
- **WHEN** EventsService is instantiated
- **THEN** constructor SHALL accept AxiosInstance parameter

#### Scenario: Service uses injected client
- **WHEN** service method makes HTTP request
- **THEN** it SHALL use injected AxiosInstance, not global import

#### Scenario: All services follow DI pattern
- **WHEN** any service class is inspected
- **THEN** it SHALL accept AxiosInstance in constructor for EventsService, GroupsService, MessagesService, NotificationsService, ConnectionsService, CoursesService, ProgramsService, StudentsService, and AuthService

### Requirement: FENResponse validation with Zod
The system SHALL provide runtime validation of FENResponse format using Zod schemas.

#### Scenario: Validator accepts Zod schema
- **WHEN** validateFENResponse is called with Zod schema
- **THEN** it SHALL validate response data against that schema

#### Scenario: Validator enforces FEN structure
- **WHEN** response is validated
- **THEN** it SHALL require success, data, error, and metadata fields

#### Scenario: Validator throws on invalid response
- **WHEN** response does not match FEN format
- **THEN** validator SHALL throw descriptive error

### Requirement: Triple-layer defensive validation
The system SHALL implement defensive validation in three layers for all service methods.

#### Scenario: Layer 1 - Structure validation
- **WHEN** service receives response
- **THEN** it SHALL validate FEN structure exists (success, data, error, metadata)

#### Scenario: Layer 2 - Type validation
- **WHEN** response.data is expected to be array
- **THEN** service SHALL ensure it is array, converting null/undefined to empty array

#### Scenario: Layer 3 - Error handling
- **WHEN** HTTP request fails
- **THEN** service SHALL return FEN-formatted error response with empty array for data, never throwing exception

### Requirement: Utility functions
The system SHALL provide platform-agnostic utility functions for debugging and configuration.

#### Scenario: Debug utilities available
- **WHEN** code imports from @uniconnect/shared/utils
- **THEN** debug logging functions SHALL be available

#### Scenario: WebSocket config available
- **WHEN** code imports from @uniconnect/shared/utils
- **THEN** WebSocket configuration helpers SHALL be available

#### Scenario: Utilities have no platform dependencies
- **WHEN** utility files are inspected
- **THEN** they SHALL NOT import from react, react-native, or expo

### Requirement: Package exports and barrel files
The system SHALL provide root barrel export for convenient imports.

#### Scenario: Root barrel exports all modules
- **WHEN** code imports from @uniconnect/shared
- **THEN** types, services, endpoints, validators, and utils SHALL all be accessible

#### Scenario: Subpath imports supported
- **WHEN** code imports from @uniconnect/shared/types
- **THEN** only types SHALL be imported without pulling in services

### Requirement: Zero-Any policy compliance
The system SHALL enforce TypeScript strict mode with zero usage of any type.

#### Scenario: Strict mode enabled
- **WHEN** shared/tsconfig.json is inspected
- **THEN** it SHALL have strict: true and noImplicitAny: true

#### Scenario: No any types in code
- **WHEN** TypeScript compilation runs
- **THEN** it SHALL produce zero errors related to implicit any

#### Scenario: Explicit types for all exports
- **WHEN** any function or class is exported
- **THEN** all parameters and return types SHALL be explicitly typed
