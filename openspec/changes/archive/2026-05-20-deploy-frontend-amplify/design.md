## Context

The Frontend-web (React 19 + Vite 8) lives at `Frontend/Frontend-web/` inside a monorepo. It depends on `@uniconnect/shared` (`file:../shared`) which must be compiled before Vite can resolve it. AWS Amplify currently runs `npm install` from the repo root (installing all workspaces including React Native) and then fails because no build command is defined and the artifact directory is unknown.

The existing `Dockerfile` and `fly.toml` target Fly.io, not Amplify. This change adds Amplify as a parallel deployment target.

## Goals / Non-Goals

**Goals:**

- Create an `amplify.yml` at the repo root that Amplify auto-detects
- Build `@uniconnect/shared` before the web app (correct monorepo dependency order)
- Output the deploy artifact to `Frontend/Frontend-web/dist/`
- Cache `node_modules` between builds for faster pipelines
- Zero changes to application source code

**Non-Goals:**

- Migrating away from Fly.io or the existing Docker deployment
- Modifying the web app build script (`tsc -b && vite build`)
- Adding Amplify Backend (no backend, only frontend hosting)

## Decisions

### D1 — `appRoot` strategy: `Frontend/Frontend-web`

**Decision**: Use `appRoot: Frontend/Frontend-web` in `amplify.yml` so that Amplify runs all commands inside the web app directory.

**Rationale**: Amplify's `appRoot` shifts the working directory for all phases. This means `npm ci` runs from `Frontend/Frontend-web/`, avoiding installation of React Native / Expo workspace deps. The shared package is reached via `cd ../shared`.

### D2 — `preBuild`: shared package compilation first

**Decision**: Run `cd ../shared && npm run build` in the preBuild phase, before the web build.

**Rationale**: `@uniconnect/shared` is referenced as `file:../shared` in `package.json`. npm workspace symlinks make it available at runtime, but the shared package's TypeScript must be compiled to JavaScript before Vite can bundle it. Without this step, the Vite build fails with module-not-found errors.

### D3 — `npm ci` with `--legacy-peer-deps`

**Decision**: Use `npm ci --legacy-peer-deps` instead of `npm install`.

**Rationale**: `npm ci` is faster (no dependency resolution), uses the lockfile exactly, and is the CI best practice. `--legacy-peer-deps` is required because the monorepo has peer dependency conflicts between React Native packages and React 19 packages — these are harmless for the web build but cause `npm ci` to fail without the flag.

### D4 — Cache at repo root level

**Decision**: Cache `node_modules/**/*` from the repo root level.

**Rationale**: Amplify's cache paths are relative to the repo root, not `appRoot`. Caching at root level means subsequent builds skip `npm ci` for most packages.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `cd ../shared` assumes monorepo structure | This is a known invariant — documented in AGENTS.md. If the structure changes, the build breaks immediately (fail-fast). |
| `--legacy-peer-deps` hides real peer conflicts | The conflicts are between React Native (Hermes) and React 19 deps, irrelevant for web builds. If the web-only dependency tree ever has real conflicts, they will surface as runtime errors. |
| Amplify cache may cause stale node_modules | The cache key is based on lockfile hash. A lockfile change invalidates the cache automatically. |
| Rollback requires git revert | Amplify auto-deploys on push. Reverting the commit and pushing restores the previous state. |
