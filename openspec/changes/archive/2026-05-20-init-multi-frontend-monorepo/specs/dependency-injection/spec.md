## ADDED Requirements

### Requirement: Service constructor accepts AxiosInstance
The system SHALL refactor all service classes to accept AxiosInstance via constructor parameter.

#### Scenario: EventsService accepts HTTP client
- **WHEN** EventsService is instantiated
- **THEN** constructor SHALL accept httpClient parameter of type AxiosInstance

#### Scenario: GroupsService accepts HTTP client
- **WHEN** GroupsService is instantiated
- **THEN** constructor SHALL accept httpClient parameter of type AxiosInstance

#### Scenario: MessagesService accepts HTTP client
- **WHEN** MessagesService is instantiated
- **THEN** constructor SHALL accept httpClient parameter of type AxiosInstance

#### Scenario: All services follow pattern
- **WHEN** any service class is inspected
- **THEN** NotificationsService, ConnectionsService, CoursesService, ProgramsService, StudentsService, and AuthService SHALL all accept httpClient parameter

### Requirement: Services use injected client
The system SHALL ensure services use injected AxiosInstance for all HTTP requests, not global imports.

#### Scenario: No global Axios imports
- **WHEN** service file is inspected
- **THEN** it SHALL NOT import api from constants/api or any global Axios instance

#### Scenario: HTTP requests use injected client
- **WHEN** service method makes HTTP request
- **THEN** it SHALL call this.httpClient.get/post/put/delete

#### Scenario: Constructor stores client reference
- **WHEN** service is instantiated
- **THEN** constructor SHALL store httpClient as private readonly property

### Requirement: Frontend instantiates services with platform-specific client
The system SHALL instantiate services with platform-specific Axios instances in each frontend.

#### Scenario: Mobile instantiates with mobile client
- **WHEN** Frontend-mobile imports service
- **THEN** it SHALL instantiate with Axios instance from Frontend-mobile/src/constants/api

#### Scenario: Web instantiates with web client
- **WHEN** Frontend-web imports service
- **THEN** it SHALL instantiate with Axios instance from createApiClient factory

#### Scenario: Services exported as singletons
- **WHEN** feature needs service
- **THEN** it SHALL import pre-instantiated singleton from services/index.ts

### Requirement: Backward compatibility during migration
The system SHALL maintain existing service interfaces during refactoring.

#### Scenario: Method signatures unchanged
- **WHEN** service method is called
- **THEN** parameters and return types SHALL remain identical to pre-refactor version

#### Scenario: FENResponse contract preserved
- **WHEN** service method returns
- **THEN** it SHALL return FENResponse<T> format as before

#### Scenario: Triple-layer validation preserved
- **WHEN** service handles response
- **THEN** it SHALL maintain structure validation, type validation, and error handling layers

### Requirement: Testability with mock clients
The system SHALL enable testing services with mock AxiosInstance.

#### Scenario: Mock client can be injected
- **WHEN** test instantiates service
- **THEN** it SHALL pass mock AxiosInstance to constructor

#### Scenario: Mock responses can be configured
- **WHEN** test configures mock client
- **THEN** it SHALL control responses for get/post/put/delete methods

#### Scenario: Service behavior can be tested in isolation
- **WHEN** test runs service method
- **THEN** it SHALL verify service logic without real HTTP calls

### Requirement: Type safety for injected client
The system SHALL enforce type safety for injected HTTP client.

#### Scenario: Constructor parameter typed
- **WHEN** service constructor is defined
- **THEN** httpClient parameter SHALL be typed as AxiosInstance

#### Scenario: Property typed as readonly
- **WHEN** httpClient is stored
- **THEN** it SHALL be declared as private readonly httpClient: AxiosInstance

#### Scenario: TypeScript enforces correct usage
- **WHEN** service is instantiated with wrong type
- **THEN** TypeScript SHALL produce compilation error

### Requirement: Documentation of DI pattern
The system SHALL document dependency injection pattern for future service additions.

#### Scenario: Pattern documented in AGENTS.md
- **WHEN** AGENTS.md is inspected
- **THEN** it SHALL include section on service DI pattern with example

#### Scenario: Example shows instantiation
- **WHEN** documentation is read
- **THEN** it SHALL show how to instantiate service with Axios instance

#### Scenario: Example shows testing
- **WHEN** documentation is read
- **THEN** it SHALL show how to test service with mock client
