## Why

EAS Build for Android consistently fails during the "Install dependencies" phase because the build server treats `Frontend/Frontend-mobile` as an isolated project rather than part of the Uniconnect monorepo. This causes `npm install` to fail when resolving workspace dependencies (`@uniconnect/shared`, `@uniconnect/api-types`) and peer dependency conflicts that are normally resolved by the root `package-lock.json`. Without a fix, we cannot generate preview or production APKs via CI/CD.

## What Changes

- **Move `eas.json` to monorepo root** with explicit workspace configuration so EAS CLI detects the monorepo and uploads the entire repository instead of the mobile subdirectory alone
- **Switch `@uniconnect/*` dependencies** from `"*"` (workspace wildcard) back to `file:` paths that remain resolvable when the full monorepo is uploaded
- **Resolve peer dependency conflict** between `react-test-renderer@19.2.6` (requires `react@^19.2.6`) and the project's pinned `react@19.1.0` by aligning versions or adding an `overrides` entry in the root `package.json`
- **Add `build:npm-force-resolutions` or `preinstall` script** to ensure EAS Build applies the same dependency overrides used in local development
- **Remove stale generated `eas.json`** from `Frontend/Frontend-mobile` to prevent EAS CLI confusion about project root

## Capabilities

### New Capabilities
- `eas-monorepo-build`: Configuration and scripts required for EAS Build to correctly build Android artifacts from within an npm workspaces monorepo

### Modified Capabilities
- *(none — this is purely a build infrastructure change; no application requirements are changing)*

## Impact

- **Build pipeline**: EAS Android builds (`preview`, `production`)
- **Repository structure**: Location of `eas.json`, dependency references in `Frontend/Frontend-mobile/package.json`
- **Root `package.json`**: Potential new `overrides` entry for `react-test-renderer` or `react`
- **Local development**: No impact — Metro and local `npm install` already work; this only fixes the remote EAS environment
