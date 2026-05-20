## ADDED Requirements

### Requirement: OpenAPI generation shall succeed without external dependencies

The system SHALL generate the OpenAPI/Swagger document during `npm run generate:openapi` without requiring a live PostgreSQL database, real JWT secrets, or any other runtime environment dependency.

#### Scenario: Build completes without DATABASE_URL
- **WHEN** `npm run generate:openapi` is executed without `DATABASE_URL` set in the environment
- **THEN** the script SHALL produce a valid `openapi.json` file and exit with code 0

#### Scenario: Build completes without JWT_SECRET
- **WHEN** `npm run generate:openapi` is executed without `JWT_SECRET` set in the environment
- **THEN** the script SHALL produce a valid `openapi.json` file and exit with code 0

#### Scenario: Build completes without .env file
- **WHEN** `npm run generate:openapi` is executed with no `.env` file present
- **THEN** the script SHALL produce a valid `openapi.json` file and exit with code 0

### Requirement: Production runtime SHALL be unaffected

The production NestJS application bootstrapped via `main.ts` SHALL NOT have any behavior change as a result of the build resilience mechanism.

#### Scenario: PrismaService connects normally in production
- **WHEN** the application starts via `npm run start:prod` (or `node dist/src/main.js`)
- **THEN** `PrismaService.onModuleInit()` SHALL call `this.$connect()` normally

#### Scenario: JwtModule uses real secret in production
- **WHEN** the application starts with `JWT_SECRET` set in the environment
- **THEN** `JwtModule` SHALL use the real `JWT_SECRET` value, not a mock
