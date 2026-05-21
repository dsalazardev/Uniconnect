## Why

The CI/CD pipeline has two critical flaws: (1) merge commits to `dev` and `main` produce "No jobs were run" because path filters skip the `quality` job entirely, and (2) deployments run independently without waiting for CI to pass, risking broken code reaching production. These gaps erode confidence in the pipeline and block automated delivery.

## What Changes

- **ci.yml**: Add `dev` branch to `pull_request` trigger; set `if: always()` on `quality` job; add `.github/**` to path filters; move path-filtering logic from job-level `if:` to a step-level guard so merge commits always run at least lint/typecheck
- **cd.yml → deploy.yml**: Rename file; change trigger from `push` to `workflow_run` depending on CI completion with success conclusion
- **No application code changes** — workflow YAML only

## Capabilities

### New Capabilities

None. This is a pipeline infrastructure fix, not a feature change.

### Modified Capabilities

None. No spec-level behavior changes.

## Impact

- `.github/workflows/ci.yml` — modified
- `.github/workflows/cd.yml` — renamed to `deploy.yml`, modified
- No impact on application code, APIs, databases, or dependencies
