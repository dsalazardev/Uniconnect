## Context

Current CI/CD has two structural issues:

1. **ci.yml `quality` job uses job-level `if:` with path filters** — when a merge commit to `dev` only touches files not covered by the filters (or only `.github/`), the job-level condition evaluates to `false` for all matrix entries, resulting in "No jobs were run" with zero feedback.
2. **cd.yml triggers on `push` to `main` independently** — deploys backend, web, and mobile EAS builds without waiting for CI to pass. A broken PR merged to main deploys broken code.

## Goals / Non-Goals

**Goals:**
- CI runs on every PR to `dev` and `main`, and on every push (merge commit) to `dev`
- Path filtering still prevents wasting time building/test packages with no changes
- Deploy workflow triggers **only after** CI passes successfully
- Zero application code touched

**Non-Goals:**
- Not adding new test runners, coverage tools, or deployment targets
- Not restructuring the monorepo build system
- Not setting up GitHub branch protection rules (requires org-level permissions)

## Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 1 | **`if: always()` on `quality` job** + step-level path guard | Job always runs (no "No jobs were run"), but individual packages skip their build/test steps when unchanged. Works regardless of event type. | Keeping job-level `if:` and adding `.github/**` to filters would still fail on merge commits where only `.github/` changed because the OR condition wouldn't match. |
| 2 | **`workflow_run` trigger for deploy** | Clean separation: CI and Deploy remain independent workflows. `workflow_run` guarantees CI completed before deploy starts. | `workflow_call` would require making CI a reusable workflow. `needs:` across workflows is not supported in GitHub Actions. |
| 3 | **Checkout with `workflow_run.head_branch`** | `workflow_run` events check out the default branch by default. Explicit ref ensures we deploy the commit that CI validated. | Using `github.ref_name` would point to `main` anyway, but explicit is safer. |
| 4 | **Step guard uses composite `if:` expression** | Avoids adding a separate `id: check-changes` step with bash logic. Simpler and more idiomatic for GitHub Actions. | Using a bash-based `run:` step to set `GITHUB_OUTPUT` would work but adds complexity. |

### Step-level guard expression

Each install/build/test step in `quality` gets:

```yaml
- name: Install Backend dependencies
  if: >-
    (matrix.package == 'backend' && needs.changes.outputs.backend == 'true') ||
    needs.changes.outputs.ci == 'true'
  run: pnpm install --frozen-lockfile
```

The `needs.changes.outputs.ci == 'true'` clause ensures that when only `.github/**` changed, all packages run through lint+typecheck at minimum (without needing path-filter matching for every package).

### workfkow_run deploy trigger

```yaml
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]
```

The `changes` job in deploy.yml adds an `if: github.event.workflow_run.conclusion == 'success'` to gate all deployment jobs.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **workflow_run cannot access CI's path-filter outputs** | Duplicate the `dorny/paths-filter` step in deploy.yml's `changes` job. Minimal duplication (10 LOC). |
| **workflow_run triggers on non-main CI runs** | `branches: [main]` scoping on the trigger. If a PR CI run completes, it won't trigger deploy because the branch filter only matches `main`. |
| **Step-level guards make quality steps more verbose** | Only 5-6 steps need the `if:` addition. The always() on coverage upload is already there. Acceptable readability cost. |
| **Merge commit triggers CI twice (push + PR sync)** | This is existing behavior, not introduced by this change. GitHub deduplicates via `github.event_name` if needed in future. |
