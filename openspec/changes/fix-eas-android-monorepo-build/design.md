## Context

The Uniconnect project is an npm workspaces monorepo with the following structure:

```
uniconnect/
├── package.json              (workspaces: ["Frontend/shared", "Frontend/Frontend-mobile", ...])
├── package-lock.json         (root lockfile with hoisted dependencies)
├── Frontend/
│   ├── Frontend-mobile/      (Expo/React Native app)
│   │   ├── package.json      (depends on "@uniconnect/shared": "*", "@uniconnect/api-types": "*")
│   │   ├── metro.config.js (monorepo-aware Metro config)
│   │   └── eas.json          (EAS Build config — CURRENTLY IN WRONG LOCATION)
│   ├── Frontend-web/
│   └── shared/               (local workspace package)
└── packages/
    └── api-types/            (local workspace package)
```

EAS Build (Expo Application Services) is the CI/CD platform used to build Android APKs. The current configuration fails because EAS CLI, when run from `Frontend/Frontend-mobile/`, only uploads that subdirectory (~1.4 MB) instead of the entire monorepo. This causes `npm install` to fail when resolving workspace dependencies (`@uniconnect/*`) and peer dependency conflicts.

**Current broken state**:
- `eas.json` is inside `Frontend/Frontend-mobile/`
- Dependencies use `"*"` (workspace wildcard) which only works within monorepo context
- `react-test-renderer@19.2.6` peer-depends on `react@^19.2.6` but project pins `react@19.1.0`
- EAS Build uses a stale commit (`2462581f`) that does not include recent fixes

## Goals / Non-Goals

**Goals:**
- EAS Build successfully uploads the entire monorepo workspace
- `npm install` completes without errors in the EAS Build environment
- Generated Android APK bundles and runs correctly with all monorepo modules
- Peer dependency conflicts are resolved automatically during EAS Build

**Non-Goals:**
- Changing the local development workflow (Metro, `npm run dev`, etc.)
- Migrating from npm workspaces to pnpm/Yarn
- Publishing `@uniconnect/*` packages to npm registry
- Modifying application runtime behavior or features

## Decisions

### Decision 1: Move `eas.json` to monorepo root with `build` path configuration

**Rationale**: EAS CLI determines the project root by looking for `eas.json` in the current directory and parent directories. When found in `Frontend/Frontend-mobile/`, EAS treats it as an isolated Expo project. Moving it to the monorepo root allows EAS to detect the workspace context.

**Alternative considered**: Keep `eas.json` in mobile directory and use EAS Build hooks (`preInstall`) to clone the monorepo. Rejected because it adds unnecessary complexity and network dependencies.

**Implementation**: 
- Move `eas.json` to repo root (`/eas.json`)
- Add `"buildPath": "Frontend/Frontend-mobile"` or equivalent configuration if supported
- Update `cli.version` to enforce compatible EAS CLI version

### Decision 2: Use `file:` paths with relative references for workspace dependencies

**Rationale**: The `"*"` wildcard requires the npm workspaces context (root `package.json` with `workspaces` array). When EAS uploads the full monorepo, `file:` paths are more explicit and work regardless of whether npm workspaces detection succeeds in the EAS environment.

**Alternative considered**: Publish `@uniconnect/shared` and `@uniconnect/api-types` to a private npm registry. Rejected because it adds registry authentication complexity and slows iteration.

**Implementation**:
```json
"@uniconnect/shared": "file:Frontend/shared",
"@uniconnect/api-types": "file:packages/api-types"
```

### Decision 3: Resolve peer dependency conflict via root `package.json` `overrides`

**Rationale**: `react-test-renderer@19.2.6` declares a peer dependency on `react@^19.2.6`, but the project intentionally pins `react@19.1.0` for Expo SDK 54 compatibility. The root `package.json` already uses `overrides` for `pretty-format` — extending this pattern is consistent.

**Alternative considered**: Upgrade `react` to `19.2.6`. Rejected because Expo SDK 54 may not support React 19.2.x and this could introduce runtime bugs.

**Implementation**:
```json
"overrides": {
  "react-test-renderer": {
    "react": "$react"
  }
}
```
Or force the version:
```json
"overrides": {
  "react-test-renderer": "19.1.0"
}
```

### Decision 4: Ensure EAS Build triggers from latest `main` commit

**Rationale**: The EAS Build logs show commit `2462581f` which does not exist in the local repo. This indicates EAS is using a cached or stale branch state.

**Implementation**:
- After pushing fixes to `main`, explicitly trigger a new EAS Build
- Use `eas build` with `--no-wait` and verify the new build ID
- Consider adding a GitHub Action workflow to auto-trigger EAS Build on push to `main`

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Moving `eas.json` breaks local `eas` commands | Medium | Low | Update project documentation; local dev uses `expo start` anyway |
| `file:` paths break if directory structure changes | Low | Medium | Document structure; consider npm workspaces `*` as fallback |
| `overrides` does not apply in EAS Build environment | Medium | High | Test with `npm install --legacy-peer-deps` fallback; add `preinstall` script |
| EAS Build archive size increases significantly | High | Low | Archive is compressed; full monorepo is still <5 MB (source only, no node_modules) |
| `metro.config.js` workspaceRoot path breaks | Low | Medium | Already configured correctly (`../../`); monitor for regressions |

## Migration Plan

1. **Phase 1 — Configuration changes** (this change)
   - Move `eas.json` to monorepo root
   - Update `Frontend/Frontend-mobile/package.json` workspace deps to `file:` paths
   - Add `react-test-renderer` override to root `package.json`
   - Commit and push to `main`

2. **Phase 2 — Validation** (after merge)
   - Trigger `eas build --platform android --profile preview --non-interactive`
   - Verify build archive size > 2 MB (indicates full monorepo)
   - Monitor `Install dependencies` phase for success
   - Download and test APK on Android device

3. **Rollback**
   - Revert commit to restore previous `eas.json` location
   - Re-trigger EAS Build to restore previous behavior

## Open Questions

1. Does EAS Build support `buildPath` or equivalent in `eas.json` for monorepo apps?
2. Should we add a GitHub Action to auto-trigger EAS Build on push to `main` to prevent commit mismatches?
3. Is `react-test-renderer@19.1.0` available and compatible with `@testing-library/react-native@12.4.3`?
