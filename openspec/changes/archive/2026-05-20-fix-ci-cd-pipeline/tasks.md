## 1. Modify ci.yml — trigger and path filters

- [x] 1.1 Add `dev` to `pull_request.branches` (line 7: `[main]` → `[main, dev]`)
- [x] 1.2 Add `ci` entry to `dorny/paths-filter` filters (after line 37): `ci: ['.github/**']`

## 2. Modify ci.yml — quality job guard strategy

- [x] 2.1 Change `quality` job `if:` from path-filter condition to `if: always()` (lines 39-46)
- [x] 2.2 Add `ci` reference to `changes` outputs: `ci: ${{ steps.filter.outputs.ci }}` (line 23)
- [x] 2.3 Add step-level `if:` guards to install/lint/test steps using the composite expression from design.md (about 6 steps)
  - Steps to guard: Install Backend (pnpm), Install workspace (npm ci), Generate Prisma, Lint, Type check, Test with coverage, Integration tests
  - Guard pattern: `if: >-\n    (matrix.package == 'backend' && needs.changes.outputs.backend == 'true') ||\n    needs.changes.outputs.ci == 'true'`

## 3. Create deploy.yml (renamed from cd.yml)

- [x] 3.1 Delete `.github/workflows/cd.yml`
- [x] 3.2 Create `.github/workflows/deploy.yml` with `workflow_run` trigger:
  - `on.workflow_run.workflows: ["CI"]`
  - `on.workflow_run.types: [completed]`
  - `on.workflow_run.branches: [main]`
- [x] 3.3 Add `changes` job in deploy.yml with `if: github.event.workflow_run.conclusion == 'success'` and duplicated path filters
- [x] 3.4 Preserve existing `deploy-backend`, `deploy-web`, `deploy-mobile`, and `notify-failure` jobs with their current `needs: changes` and path-filter `if:` conditions
- [x] 3.5 Ensure `notify-failure` job uses `workflow_run.conclusion == 'failure'` compatible condition (or falls back to `failure()`)

## 4. Security — Remove hardcoded JWT secret

- [x] 4.1 Replace hardcoded JWT secret in `Frontend/Frontend-mobile/README.md:112` with `<your-jwt-secret>` placeholder

## 5. Update CI-CD.md references

- [x] 5.1 Diagram: `cd.yml` → `deploy.yml` (line 19)
- [x] 5.2 Table: `cd.yml` → `deploy.yml` (line 139)
- [x] 5.3 Correct deleted file entry: non-existent path → real path (line 146)

## 6. Clean up legacy workflows

- [x] 6.1 Delete `Backend/.github/workflows/ci-cd.yml` (legacy backend workflow)
- [x] 6.2 Delete `Frontend/.github/workflows/ci-cd.yml` (legacy frontend workflow)

## 7. Secure fallback JWT secrets in production code

- [x] 7.1 Remove `|| 'uniconnect-test-key'` fallback in `Backend/src/auth/strategies/jwt.strategy.ts:14`
- [x] 7.2 Remove `|| 'uniconnect-test-key'` fallback in `Backend/src/auth/auth.module.ts:32`

## 8. Make coverage threshold blocking

- [x] 8.1 Remove `|| echo "Coverage threshold check complete (warning only)"` from ci.yml:155
  - Now `npx jest ... --coverageThreshold` will fail the step if coverage < 70%

## 9. Add GitHub Releases to deploy pipeline

- [x] 9.1 Add `permissions: contents: write` to deploy.yml
- [x] 9.2 Add `create-release` job in deploy.yml after deploy jobs:
  - Reads version from Backend/package.json
  - Creates GitHub Release with tag `v<version>-<run_number>`
  - Includes links to Fly.io backends and EAS Build page

## 10. Create rollback workflow

- [x] 10.1 Create `.github/workflows/rollback.yml` with:
  - `workflow_dispatch` trigger with inputs: `app` (backend/web/mobile) and `version` (SHA256/commit)
  - `rollback-backend`: deploys previous Fly.io image via SHA256 digest
  - `rollback-web`: deploys previous Fly.io image via SHA256 digest
  - `rollback-mobile`: checks out previous commit and triggers EAS Build
  - `notify-failure`: Slack notification on failure

## 11. Verify

- [x] 11.1 Validate YAML syntax on all workflow files (ci.yml, deploy.yml, rollback.yml)
- [x] 11.2 Validate TypeScript compilation on modified backend files
- [ ] 11.3 Push to `dev` branch and verify CI triggers on PR to `dev` *(pending — requires git push)*
- [ ] 11.4 Create a merge commit (or direct push) to `dev` and verify `quality` job runs with `if: always()` *(pending — requires git push)*
