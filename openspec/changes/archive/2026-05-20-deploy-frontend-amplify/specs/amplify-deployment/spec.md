## ADDED Requirements

### Requirement: Amplify build pipeline SHALL detect the deployment configuration

The Amplify build pipeline SHALL read the deployment configuration from an `amplify.yml` file at the repository root, without requiring manual console setup.

#### Scenario: amplify.yml auto-detection
- **WHEN** Amplify starts a build
- **THEN** it SHALL read `amplify.yml` from the repo root and use its phase definitions

### Requirement: Build order SHALL compile shared package before web app

The pipeline SHALL compile `@uniconnect/shared` (TypeScript → JavaScript) before building the web application, because Vite resolves the shared package as a local dependency.

#### Scenario: Shared package build
- **WHEN** the preBuild phase executes
- **THEN** `cd ../shared && npm run build` SHALL run before the web build phase
- **AND** the output of the shared build SHALL be available in `node_modules/@uniconnect/shared`

### Requirement: Web app SHALL build successfully

The pipeline SHALL run `npm run build` (which executes `tsc -b && vite build`) from the `Frontend/Frontend-web/` directory and produce output in `dist/`.

#### Scenario: Successful build
- **WHEN** the build phase executes
- **THEN** the process SHALL exit with code 0
- **AND** the `Frontend/Frontend-web/dist/` directory SHALL contain the compiled assets

#### Scenario: TypeScript compilation errors fail the build
- **WHEN** TypeScript compilation fails
- **THEN** the build SHALL exit with a non-zero code
- **AND** no deploy artifact SHALL be published

### Requirement: Artifacts SHALL be published from the dist directory

Amplify SHALL publish all files under `Frontend/Frontend-web/dist/` as the deploy artifact.

#### Scenario: Artifact publication
- **WHEN** the build phase completes successfully
- **THEN** Amplify SHALL deploy the contents of `Frontend/Frontend-web/dist/` to the hosted domain
