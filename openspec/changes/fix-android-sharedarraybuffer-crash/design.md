# Design: Fix Android SharedArrayBuffer Crash

## Goal

Provide a robust, low-risk solution to prevent Hermes crashes caused by
`SharedArrayBuffer` references making their way into the Metro bundle. The
design evaluates alternatives and prescribes the primary remediation path and
support steps (verification and CI checks).

## Alternatives considered

1. Override `pretty-format` to 29.7.0 (recommended)
   - Pros: Minimal surface, quick to apply, documented in AGENTS.md.
   - Cons: Can mask upstream issues; must be enforced in CI and tracked.

2. Patch the offending package with `patch-package` (last resort)
   - Pros: Local control, granular fixes.
   - Cons: Maintains technical debt; requires rollback plan.

3. Switch to JSC (temporary diagnostic)
   - Pros: Confirms Hermes is the problem.
   - Cons: Not acceptable for production due to performance and parity.

4. Remove hoisted dev-deps from Metro watchFolders / resolver paths
   - Pros: Fixes root cause if devDeps are leaking into runtime.
   - Cons: Risky reconfiguration of Metro; could break other monorepo assumptions.

## Chosen design

Primary path: Implement Alternative 1 (override to `pretty-format@29.7.0`) as
the remediation, combined with:

- A thorough non-destructive diagnosis step to identify the offending module
  (so the override is justified).
- Reinstall + clean install steps and Metro + Gradle cache clearing.
- CI checks that detect regressions (prevent reinsertion of pretty-format@30)
- Documentation updates in AGENTS.md and CONTRIBUTING.

## Implementation details

1. Diagnosis script (commands)

```bash
# Check pretty-format versions and why it's present
npm ls pretty-format --all
npm why pretty-format

# Start Metro and inspect bundle
cd Frontend/Frontend-mobile
npx expo start
curl -s "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" -o /tmp/index.android.bundle
rg -n -C 6 "SharedArrayBuffer" /tmp/index.android.bundle || true
```

2. Remediation commands (after approval)

```bash
# WARNING: destructive - coordinate with team
rm -rf node_modules Frontend/Frontend-mobile/node_modules Frontend/shared/node_modules
rm -f package-lock.json pnpm-lock.yaml yarn.lock
npm install --legacy-peer-deps

# Verify
npm ls pretty-format --all
curl -s "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" -o /tmp/index.android.bundle
rg -n "SharedArrayBuffer" /tmp/index.android.bundle || true
npx expo start -c
cd Frontend/Frontend-mobile && npx expo run:android
```

3. CI checks (see ci-checks.md)

4. Rollback / follow-up

- Create a ticket to follow upstream fixes and remove overrides when
  `pretty-format` (or the offending lib) is safe.

## Drawbacks

- Overrides are a short-to-medium term fix; maintainers must track the
  technical debt and remove them when feasible.
