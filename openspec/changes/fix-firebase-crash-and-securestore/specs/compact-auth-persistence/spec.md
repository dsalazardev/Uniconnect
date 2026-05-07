# Capability: compact-auth-persistence

## Summary

Persist a compact and deterministic authentication snapshot to `expo-secure-store` under key `uniconnect-auth` ensuring stored value size stays below 2048 bytes. Provide safe migration/recovery for legacy large payloads.

## Requirements

1. The stored JSON must contain only the minimal fields required to re-establish a session or to refresh tokens:
   - accessToken (string) — optional: prefer refresh token flows where applicable
   - refreshToken (string) — optional
   - user: { id_user: number; full_name?: string; email?: string; picture?: string; id_role?: number }
   - expires_at?: number (epoch ms)
2. The serialized JSON length must be < 2048 bytes in normal usage for typical token sizes.
3. On initializeFromStorage():
   - If `uniconnect-auth` is absent → proceed as unauthenticated.
   - If present and parseable and size <= 2048 → restore state accordingly.
   - If present and size > 2048 → attempt to parse; if parse succeeds, construct a compact snapshot from available fields and overwrite the stored item with the compact version. If parse fails, clear the stored entry and mark the store as uninitialized (force login).
4. Provide logging for all recovery paths (parse error, trimmed, cleared) including diagnostic details (hash or length) but not raw tokens.

## Acceptance Criteria

- Given preexisting large auth blob, app starts and either migrates to compact snapshot or clears it and prompts user to sign-in; app does not crash.
- Given normal auth flow, persisted compact snapshot is consistent and smaller than 2048 bytes.

## Implementation Notes

- Primary change point: `src/features/auth/store/AuthStore.ts` — modify `persistToStorage()` and `initializeFromStorage()`.
- Keep JSON deterministic (sorted keys) to make size predictable. Use minimal fields only.
- Do not store entire role object or large nested structures; store role id only.
