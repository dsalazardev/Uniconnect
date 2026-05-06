# Fix Android SharedArrayBuffer Crash

## What & Why

Summary
-------
Android builds using Expo with Hermes crash at runtime with:

```
ReferenceError: Property 'SharedArrayBuffer' doesn't exist
```

This occurs when the JS bundle (produced by Metro) contains references to
`SharedArrayBuffer` — an API not implemented by Hermes. In our monorepo this
typically comes from a dependency chain that includes `pretty-format@30.x` or
other libraries that use SharedArrayBuffer (workers / WASM). The goal of this
change is to produce a reproducible diagnosis, a safe remediation plan, and
CI safeguards to prevent regressions.

Scope
-----
In-scope:

- Reproducible diagnosis steps and scripts to identify the offending package
  or chain of dependencies.
- A remediation plan that prioritizes non-invasive changes first (verify and
  only then apply `overrides` and reinstall), including exact commands.
- Verification steps for local/dev, CI and release (EAS) pipelines.
- CI checks to detect `pretty-format >= 30` or JS bundles containing
  `SharedArrayBuffer`.

Out-of-scope:

- Direct modification of runtime code in the app as part of this change. This
  change creates the specification and tasks; implementation will be a
  separate step unless agreed otherwise.

Acceptance Criteria
-------------------
After remediation and verification, the following must hold:

1. `npm ls pretty-format --all` shows either `pretty-format@29.7.0` or no
   version >= 30 installed in the resolved tree.
2. Downloaded Metro bundle (dev/production) does not contain the string
   `SharedArrayBuffer`.
3. `npx expo run:android` launches the app on a Hermes device without
   ReferenceError.
4. CI fails if `pretty-format >= 30` is introduced or if the bundle contains
   `SharedArrayBuffer`.

Risks
-----
- Forcing dependency overrides can mask real incompatibilities. Mitigation:
  CI checks and a ticket to upstream to remove overrides when safe.
- Removing lockfiles / node_modules is disruptive. Mitigation: document the
  canonical package manager (recommendation: `npm`) and coordinate with the
  team.

Estimated effort: 4–8 hours (diagnosis, remediation, CI, documentation).

Owner: TBD
Reviewers: TBD
