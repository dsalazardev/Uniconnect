## ADDED Requirements

### Requirement: Workspace configuration with npm workspaces
The system SHALL configure npm workspaces to link three packages: Frontend-mobile, Frontend-web, and shared.

#### Scenario: Root package.json exists
- **WHEN** repository root is inspected
- **THEN** package.json SHALL exist with workspaces field containing ["shared", "Frontend-mobile", "Frontend-web"]

#### Scenario: Workspace packages are linked
- **WHEN** npm install is run from root
- **THEN** all three packages SHALL be symlinked in root node_modules

#### Scenario: Shared package is accessible from frontends
- **WHEN** Frontend-mobile or Frontend-web imports @uniconnect/shared
- **THEN** import SHALL resolve to local shared package without registry lookup

### Requirement: Unified development scripts
The system SHALL provide workspace-level scripts for running all packages.

#### Scenario: Mobile development script
- **WHEN** npm run dev:mobile is executed from root
- **THEN** Expo development server SHALL start in Frontend-mobile

#### Scenario: Web development script
- **WHEN** npm run dev:web is executed from root
- **THEN** Vite development server SHALL start in Frontend-web on port 5173

#### Scenario: Backend development script
- **WHEN** npm run dev:backend is executed from root
- **THEN** NestJS development server SHALL start in Backend

#### Scenario: Unified test script
- **WHEN** npm run test:all is executed from root
- **THEN** tests SHALL run in both Frontend-mobile and Frontend-web sequentially

#### Scenario: Unified typecheck script
- **WHEN** npm run typecheck:all is executed from root
- **THEN** TypeScript SHALL check shared, Frontend-mobile, and Frontend-web

### Requirement: Git history preservation
The system SHALL preserve existing Git history when restructuring Frontend to Frontend-mobile.

#### Scenario: Git directory remains at root
- **WHEN** restructuring is complete
- **THEN** .git directory SHALL remain at repository root, not moved to Frontend-mobile

#### Scenario: Commit history is intact
- **WHEN** git log is run in Frontend-mobile
- **THEN** all historical commits from Frontend SHALL be visible

### Requirement: Workspace installation
The system SHALL support installing all dependencies with single command.

#### Scenario: Root install installs all packages
- **WHEN** npm install is run from root
- **THEN** dependencies SHALL be installed for shared, Frontend-mobile, and Frontend-web

#### Scenario: Hoisting optimization
- **WHEN** multiple packages depend on same library
- **THEN** npm SHALL hoist shared dependencies to root node_modules

### Requirement: Root configuration files
The system SHALL provide root-level configuration for workspace-wide settings.

#### Scenario: Root gitignore exists
- **WHEN** repository root is inspected
- **THEN** .gitignore SHALL exist with node_modules/, dist/, .expo/, .env entries

#### Scenario: Root README exists
- **WHEN** repository root is inspected
- **THEN** README.md SHALL exist with workspace setup instructions
