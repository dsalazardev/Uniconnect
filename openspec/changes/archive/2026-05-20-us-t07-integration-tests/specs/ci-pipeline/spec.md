## ADDED Requirements

### Requirement: Integration test job in CI pipeline
The CI pipeline SHALL have a job that runs the backend integration tests (`npm run test:e2e`) with coverage reporting for Sprint 4 modules.

#### Scenario: Integration tests run on every push
- **WHEN** code is pushed to a non-main branch
- **THEN** the CI pipeline executes the backend integration test suite and reports pass/fail status

#### Scenario: Coverage threshold is enforced
- **WHEN** the integration test job completes
- **THEN** the coverage report is checked against a minimum threshold of 70% for statements, branches, functions, and lines on Sprint 4 source files

### Requirement: E2E mobile job in CI pipeline
The CI pipeline SHALL have a job that runs the Maestro E2E suite on an Android emulator.

#### Scenario: Android emulator boots and runs E2E flow
- **WHEN** the E2E job is triggered in CI
- **THEN** an Android emulator (API 34) boots, installs the debug APK, and executes the study-session Maestro flow

#### Scenario: E2E job produces artifacts on failure
- **WHEN** the E2E flow fails in CI
- **THEN** the Maestro output directory (~/.maestro/output/) is uploaded as a CI artifact containing screenshots and video of the failed flow

### Requirement: E2E job triggers only on specific conditions
The E2E mobile job SHALL run only on pull requests to main or on manual dispatch, not on every push, due to its runtime cost (~15-20 minutes).

#### Scenario: E2E job skips on non-PR pushes
- **WHEN** code is pushed directly to a feature branch (not a PR)
- **THEN** the E2E job is skipped and only integration tests run

#### Scenario: Manual dispatch triggers full E2E
- **WHEN** a workflow dispatch is triggered with `e2e: true`
- **THEN** the E2E job runs even without a PR

### Requirement: Integration test coverage is reported on PRs
The CI pipeline SHALL report integration test coverage as a PR comment using `romeovs/lcov-reporter-action`.

#### Scenario: Coverage comment is posted on PR
- **WHEN** a PR is opened or updated and the integration test job passes
- **THEN** a PR comment is posted with coverage statistics for Sprint 4 modules
