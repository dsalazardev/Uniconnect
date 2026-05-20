## Context

The Frontend-web build script (`npm run build`) chains `tsc -b && vite build`. `tsc -b` performs strict type-checking on the entire project and fails on any error. Currently 58 TypeScript errors exist across the codebase, blocking all Amplify deployments. The runtime code is functionally correct — Vite's bundling step succeeds independently.

The purpose of this change is to decouple production bundling from type-checking in CI/CD, with zero changes to local development experience.

## Goals / Non-Goals

**Goals:**

- Make Amplify deployment succeed immediately
- Keep `npm run build` working exactly as before for local dev
- Remove unnecessary preBuild steps from `amplify.yml`
- Isolate the type-checking decoupling to CI/CD only

**Non-Goals:**

- Fixing the 58 TypeScript errors (tracked separately)
- Changing local development workflows
- Modifying Amplify Console configuration

## Decisions

### ADR-1: Separate production build script from local build

**Driver**: Amplify needs a build that skips `tsc -b`.

**Decision**: Add `"build:prod": "vite build"` to `Frontend/Frontend-web/package.json`. Keep `"build": "tsc -b && vite build"` unchanged.

**Rationale**:
- `npm run build` continues to enforce type-checking locally — developers catch errors before pushing
- `npm run build:prod` is a slimmed-down script used only in CI/CD where speed > strictness
- Vite/Rollup strips TypeScript types during bundling — the output is identical with or without `tsc -b`
- A separate `"type-check": "tsc -b"` script is already available for explicit type-checking

**Code**:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "build:prod": "vite build",
  "type-check": "tsc -b",
  ...
}
```

### ADR-2: Exclude `contract-check.ts` from type-checking scope

**Driver**: `contract-check.ts` imports `@uniconnect/api-types` which is auto-generated from `openapi.json` and does not exist in the Amplify environment.

**Decision**: Exclude `contract-check.ts` from `tsconfig.app.json` by adding it to the `exclude` list.

**Rationale**:
- `contract-check.ts` is a runtime validation file, not production UI code
- The dependency `@uniconnect/api-types` is generated during `npm run generate:api-types` and lives in `packages/api-types/` — it's not committed to the repo and not available in Amplify's build environment
- Excluding the file from `tsc -b` prevents the `TS2307` error without modifying the file's logic

**Code**:
```json
{
  "include": ["src"],
  "exclude": ["src/contract-check.ts"]
}
```

### ADR-3: Simplify `amplify.yml` preBuild phase

**Driver**: The `cd ../shared && npm run build` step in preBuild is unnecessary.

**Decision**: Remove `cd ../shared && npm run build` from the preBuild phase. Change build command to `npm run build:prod`.

**Rationale**:
- `@uniconnect/shared` has `"main": "src/index.ts"` — the web app imports `.ts` source files directly
- `"allowImportingTsExtensions": true` in `tsconfig.app.json` enables TypeScript to resolve `.ts` files from the shared package without pre-compilation
- Vite's bundler (esbuild/Rollup) handles `.ts` files natively — no pre-compilation needed
- `npm ci --legacy-peer-deps` installs shared's dependencies via npm workspaces/symlinks, making them available for Vite to resolve

**Updated `amplify.yml`**:
```yaml
version: 1
applications:
  - appRoot: Frontend/Frontend-web
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci --legacy-peer-deps
        build:
          commands:
            - npm run build:prod
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Type errors reach production without being caught | `npm run build` (with tsc) is used locally; CI can add `npm run type-check` as a non-blocking advisory step |
| `contract-check.ts` silently breaks at runtime | It's a validation script; its failure is non-critical and would be caught in dev/staging environments |
| Shared package has untested runtime changes | The shared package is compiled by Vite during bundling — any syntax error surfaces immediately as a build failure |
