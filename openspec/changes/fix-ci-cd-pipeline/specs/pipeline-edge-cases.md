## Pipeline Behavior Specifications

This change has no new capabilities — it modifies CI/CD workflow infrastructure only.
No spec-level behavior changes are introduced.

### Relevant Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Merge commit only touching `.github/` | `quality` job runs with `if: always()`, all 4 matrix packages check their step-level guard — since `ci == 'true'`, they all run lint+typecheck but skip build/test |
| PR opened to `dev` with backend changes | CI triggers on `pull_request` to `dev`, `quality` job runs, only backend steps execute (guarded by path filter), deploy is NOT triggered (deploy only on `main`) |
| PR merged to `main` with web changes | CI runs on merge commit, `quality` passes, `workflow_run` triggers deploy.yml, only web deploy job runs |
| CI fails on `main` push | `workflow_run` fires with `conclusion: failure`, deploy `changes` job's `if` condition is false — no deployment occurs, `notify-failure` sends Slack alert |
