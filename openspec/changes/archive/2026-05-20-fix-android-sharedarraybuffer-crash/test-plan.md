# Test Plan: fix-android-sharedarraybuffer-crash

This test plan covers manual and automated verification steps to ensure the
SharedArrayBuffer crash is resolved and prevented from reoccurring.

Manual verification (local)
---------------------------
1. Run `npm ls pretty-format --all` from repo root. Expected: `pretty-format@29.7.0` (or no 30.x).
2. Start Metro: `cd Frontend/Frontend-mobile && npx expo start`.
3. Download bundle: `curl -s "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" -o /tmp/index.android.bundle`.
4. Search for `SharedArrayBuffer`: `rg -n "SharedArrayBuffer" /tmp/index.android.bundle || true` — expected: no matches.
5. Clear Metro cache and rebuild: `npx expo start -c` then `npx expo run:android` and verify the app boots without the ReferenceError.

Automated verification (CI)
--------------------------
CI job 1 — dependency check
  - Run after `npm ci`.
  - Script (bash):
    ```bash
    VER=$(npm ls pretty-format --json | jq -r '.dependencies.pretty-format.version // empty')
    if [ -z "$VER" ]; then
      echo "pretty-format not found"; exit 0
    fi
    if echo "$VER" | rg -q '^30'; then
      echo "ERROR: pretty-format >= 30 detected: $VER"; exit 1
    fi
    echo "pretty-format ok: $VER"
    ```

CI job 2 — bundle smoke test
  - Build or generate the JS bundle in CI (same command as local for production bundle).
  - Grep for `SharedArrayBuffer` in the artifact; fail if present.

Acceptance Criteria
-------------------
- All manual verifications pass locally.
- CI fails on introduction of pretty-format >= 30 or on bundles that contain
  `SharedArrayBuffer`.
