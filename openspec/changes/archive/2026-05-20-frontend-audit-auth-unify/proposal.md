# Proposal: Frontend audit & Auth unification

What
----
Perform a focused frontend audit (web + mobile) and produce a concrete plan to unify authentication across platforms by leveraging @uniconnect/shared's ApiClient/AuthProvider pattern. The change will deliver:

- Findings from a codebase sweep (topology, breaking points, and current debts)
- A design that standardizes the AuthProvider implementation across Web and Mobile, removes platform-specific token refresh duplication, and hardens the axios factory usage
- A prioritized task list to implement the unification safely with minimal disruption

Why
---
The monorepo already provides a shared Axios factory with an AuthProvider interface and a working token refresh mutex (FIX-10). However, the web and mobile workspaces still contain ad-hoc fixes and platform-specific stubs; tests and builds indicate unresolved build failures and runtime crashes (SecureStore/Firebase and Jest ESM mismatches). Unifying auth around the shared factory will: 

- Reduce duplication and the number of platforms implementing refresh logic
- Centralize token handling and logging for easier debugging
- Make it safe to remove temporary stubs and complete parity work described in existing change web-mobile-architecture-parity
- Reduce risks of concurrent refresh races by using the established mutex/queue pattern present in shared/src/api/client.ts

Risks & Constraints
------------------
- The repo contains pre-existing build failures (see web-mobile parity tasks) that block full end-to-end verification in CI. This change focuses on audit, design and tasks — not on immediate fixes to unrelated build failures.
- Do not mutate source while auditing. Implementation will happen after design approval.
- The shared client already enforces an auth-ready guard (isInitialized/isReady). Migration must preserve startup behavior for unauthenticated flows.

Deliverables
------------
1. findings.md — concise technical findings (topology, debt, risks)
2. design.md — the migration design and API contracts
3. tasks.md — step-by-step implementation plan with ordering and estimates

Location
--------
openspec/changes/frontend-audit-auth-unify/
