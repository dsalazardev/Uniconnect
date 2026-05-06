# CI Checks: fix-android-sharedarraybuffer-crash

This document describes CI steps to prevent reintroduction of `SharedArrayBuffer`
into the JS bundle and to detect `pretty-format@30+` in the resolved dependency tree.

1) Dependency check job

- Purpose: Fail the pipeline if `pretty-format` is resolved to a vulnerable
  version (>= 30).
- Example script (bash):

```bash
set -e
VER=$(npm ls pretty-format --json | jq -r '.dependencies.pretty-format.version // empty')
if [ -z "$VER" ]; then
  echo "pretty-format not found; skipping check"
  exit 0
fi
if echo "$VER" | rg -q '^30'; then
  echo "ERROR: pretty-format >= 30 detected: $VER"
  exit 1
fi
echo "pretty-format version OK: $VER"
```

2) Bundle smoke test

- Purpose: Fail the pipeline if the generated JS bundle contains the string
  `SharedArrayBuffer` (strong indicator that incompatible code made it to the
  artifact).
- Steps:
  1. Build or generate the JS bundle (production settings recommended).
  2. Grep the artifact: `rg -n "SharedArrayBuffer" bundle.js && exit 1 || echo "bundle clean"`

3) Policy and documentation

- Update AGENTS.md / CONTRIBUTING to list these checks and the standard
  package manager (recommendation: `npm`).
