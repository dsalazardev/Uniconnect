## ADDED Requirements

### Requirement: Declare all runtime dependencies
The web `package.json` SHALL explicitly declare every runtime dependency used in source code, regardless of hoisting.

#### Scenario: Dependency declaration
- **WHEN** a module imports from `@tanstack/react-query`, `socket.io-client`, or any future direct dependency
- **THEN** the package SHALL be listed in `dependencies` in `web/package.json`
- **THEN** `npm install` SHALL succeed without peer-dependency warnings

#### Scenario: Verify via typecheck
- **WHEN** `npx tsc --noEmit` is run
- **THEN** there SHALL be no TS2307 (cannot find module) errors for declared dependencies
