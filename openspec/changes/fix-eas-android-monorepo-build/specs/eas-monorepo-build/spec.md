## ADDED Requirements

### Requirement: EAS Build uploads entire monorepo workspace
The EAS Build process SHALL upload the entire Uniconnect monorepo repository, including `Frontend/shared/` and `packages/api-types/`, so that workspace dependencies are resolvable during `npm install`.

#### Scenario: EAS Build from Frontend-mobile directory
- **WHEN** developer runs `eas build --platform android --profile preview` from `Frontend/Frontend-mobile/`
- **THEN** EAS CLI detects the monorepo root via `eas.json` configuration
- **AND** the build archive includes all workspace packages referenced by `file:` dependencies
- **AND** the build archive size is greater than 1.5 MB (indicating full monorepo upload, not just mobile app)

### Requirement: Workspace dependencies resolve in EAS Build environment
The build server SHALL successfully resolve `@uniconnect/shared` and `@uniconnect/api-types` during the `Install dependencies` phase.

#### Scenario: npm install with monorepo context
- **WHEN** EAS Build executes `npm install` in the monorepo root context
- **THEN** `@uniconnect/shared` resolves to the local `Frontend/shared` directory
- **AND** `@uniconnect/api-types` resolves to the local `packages/api-types` directory
- **AND** no `ERESOLVE` or `ENOENT` errors occur for workspace packages

### Requirement: Peer dependency conflicts resolved during EAS Build
The build server SHALL handle peer dependency conflicts between `react-test-renderer` and `react` versions without failing the install phase.

#### Scenario: Install with React version mismatch
- **WHEN** `npm install` encounters `react-test-renderer@19.2.6` requiring `react@^19.2.6` alongside pinned `react@19.1.0`
- **THEN** the install completes successfully using `legacy-peer-deps` or `overrides` configuration
- **AND** the `Install dependencies` build phase exits with code 0

### Requirement: Metro bundler resolves monorepo modules in built APK
The built Android APK SHALL correctly bundle and resolve modules from the monorepo workspace, including `@uniconnect/shared` and transitive dependencies.

#### Scenario: APK runtime module resolution
- **WHEN** the generated APK is installed and launched on an Android device
- **THEN** the app initializes without `Unable to resolve module` Metro errors
- **AND** imports from `@uniconnect/shared` execute correctly
- **AND** the `socket.io-client` bundled via `dist/socket.io.esm.min.js` functions in chat features

## MODIFIED Requirements

*(none — no existing capabilities are changing their requirements)*

## REMOVED Requirements

*(none — no features are being deprecated)*
