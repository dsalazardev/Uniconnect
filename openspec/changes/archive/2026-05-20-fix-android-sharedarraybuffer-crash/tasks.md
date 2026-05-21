# Tasks: fix-android-sharedarraybuffer-crash

This file lists the work items to diagnose and remediate the Hermes
SharedArrayBuffer crash. Each task includes commands, acceptance criteria and
estimated effort.

T1 - Diagnosis (non-destructive)
- Owner: TBD
- Est: 30–60 minutes
- Steps:
  1. From repo root run: `npm ls pretty-format --all` and `npm why pretty-format`.
  2. Start Metro in a separate terminal: `cd Frontend/Frontend-mobile && npx expo start`.
  3. Download bundle: `curl -s "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" -o /tmp/index.android.bundle`.
  4. Search for `SharedArrayBuffer`: `rg -n -C 6 "SharedArrayBuffer" /tmp/index.android.bundle || true`.
  5. Collect `npm ls` and bundle snippets for the remediation decision.
- Acceptance: identified package (or confirmation that pretty-format@30.x is present) and evidence from the bundle.

T2 - Remediation plan (apply overrides and reinstall)
- Owner: TBD
- Est: 1–2 hours
- Preconditions: T1 confirms presence of offending lib/version.
- Steps:
  1. Ensure package.json root has `overrides` for pretty-format: 29.7.0 (and related jest libs per AGENTS.md).
  2. Coordinate with team: announce lockfile reinstall.
  3. Run destructive reinstall (from repo root):
     - `rm -rf node_modules Frontend/Frontend-mobile/node_modules Frontend/shared/node_modules`
     - `rm -f package-lock.json pnpm-lock.yaml yarn.lock`
     - `npm install --legacy-peer-deps`
  4. Verify `npm ls pretty-format --all` to ensure 29.7.0 is installed.
  5. Start Metro and verify bundle doesn't include `SharedArrayBuffer`.
  6. Run `npx expo run:android` and verify device boot without ReferenceError.
- Acceptance: All checks pass (bundle clean, app runs on Hermes device).

T3 - CI Checks
- Owner: TBD
- Est: 1–2 hours
- Steps:
  1. Add a CI job that runs after `npm ci` to check resolved pretty-format version and fail if >= 30.
  2. Add a CI job that generates a bundle (or uses production artifact) and greps for `SharedArrayBuffer`.
  3. Document the CI job in `ci-checks.md` and link in CONTRIBUTING.
- Acceptance: CI fails when pretty-format >= 30 or bundle contains SharedArrayBuffer.

T4 - Documentation & Follow-up
- Owner: TBD
- Est: 30–60 minutes
- Steps:
  1. Update AGENTS.md with the incident, the fix, and the team policy about `overrides` vs `resolutions`.
  2. Create a follow-up ticket to remove overrides when upstream fixes or newer versions are verified.
  3. Communicate the change to the team and update dev onboarding docs (how to reinstall safely).
- Acceptance: AGENTS.md updated and ticket created.
