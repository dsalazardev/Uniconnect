## Why

The Frontend-web (React + Vite) has no Amplify deployment configuration in the repository. AWS Amplify fails after `npm install` with "No backend environment association" because there is no `amplify.yml` to define the monorepo structure, build commands, and artifact paths. Without this file, every deploy requires manual configuration in the Amplify console and breaks on redeploys.

## What Changes

- **`amplify.yml`** (new file at repo root): Define the Amplify build pipeline for the Frontend-web within the monorepo, specifying `appRoot: Frontend/Frontend-web`, the preBuild phase (install deps + build `@uniconnect/shared`), and the build phase (`npm run build`).
- No changes to existing source code or Dockerfile. This is purely a CI/CD addition.

## Capabilities

### New Capabilities
- `amplify-deployment`: Define the build and deploy pipeline for AWS Amplify, including monorepo root configuration, dependency caching, shared package compilation order, and artifact output paths.

### Modified Capabilities
*(None — no spec-level behavior changes; infrastructure-only addition.)*

## Impact

- **Build pipeline**: Amplify will detect `amplify.yml` at the repo root and use its phases instead of the console defaults.
- **No source changes**: The web app code, `package.json`, and `vite.config.ts` remain untouched.
- **Deploy artifact**: `Frontend/Frontend-web/dist/` will be published to the Amplify domain.
