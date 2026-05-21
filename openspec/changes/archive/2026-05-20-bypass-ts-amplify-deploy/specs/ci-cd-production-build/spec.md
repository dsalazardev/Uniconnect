## ADDED Requirements

### Requirement: Production build SHALL produce a deployable artifact without type-checking

The CI/CD pipeline SHALL execute a production build that bundles the application without requiring `tsc -b` to pass.

#### Scenario: Build:prod succeeds with type errors present
- **WHEN** `npm run build:prod` is executed from `Frontend/Frontend-web/`
- **AND** the codebase has TypeScript type errors
- **THEN** the process SHALL exit with code 0
- **AND** `dist/` SHALL contain compiled assets

### Requirement: Local build SHALL continue to enforce type-checking

The `npm run build` script SHALL continue to run `tsc -b && vite build` for local development.

#### Scenario: Local build detects type errors
- **WHEN** `npm run build` is executed
- **AND** the codebase has TypeScript errors
- **THEN** the process SHALL fail with a non-zero exit code
- **AND** no `dist/` artifact SHALL be produced

### Requirement: `contract-check.ts` SHALL NOT block the build

The file `src/contract-check.ts` imports `@uniconnect/api-types` which may not exist in all build environments. It SHALL be excluded from `tsc -b` scope.

#### Scenario: contract-check excluded from type-checking
- **WHEN** `tsc -b` or `npm run build` runs
- **AND** `@uniconnect/api-types` is not installed
- **THEN** the build SHALL NOT fail due to `contract-check.ts`

### Requirement: amplify.yml preBuild SHALL NOT compile shared package

The Amplify build pipeline SHALL NOT run `cd ../shared && npm run build` because the web app imports shared source files directly via TypeScript extension imports.

#### Scenario: Shared package compiles at bundle time
- **WHEN** Amplify executes `vite build`
- **THEN** Vite SHALL resolve and compile `@uniconnect/shared`'s TypeScript source files natively
- **AND** no separate shared compilation step SHALL be needed
