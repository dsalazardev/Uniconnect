/**
 * CA4 — Verificación de contrato en tiempo de compilación (mobile).
 *
 * Este archivo NO se importa en runtime. Su único propósito es que
 * `tsc` falle si el backend cambia el contrato de algún endpoint
 * sin que el frontend actualice su código.
 */

import type { paths as ApiPaths } from '@uniconnect/api-types';

// ── Biblioteca de recursos ────────────────────────────────────────────────────
type _ResourceListResponse =
  ApiPaths['/api/biblioteca/programas/{id}/recursos']['get']['responses'][200]['content']['application/json'];

type _CreateResourceResponse =
  ApiPaths['/api/biblioteca/programas/{id}/recursos']['post']['responses'][201]['content']['application/json'];

// ── Eventos ───────────────────────────────────────────────────────────────────
type _EventListResponse =
  ApiPaths['/api/events']['get']['responses'][200]['content']['application/json'];

// ── Usuarios ──────────────────────────────────────────────────────────────────
type _UserProfileResponse =
  ApiPaths['/api/users/profile']['get']['responses'][200]['content']['application/json'];

// ── Notificaciones ────────────────────────────────────────────────────────────
type _NotificationListResponse =
  ApiPaths['/api/notifications']['get']['responses'][200]['content']['application/json'];

// ── Grupos ────────────────────────────────────────────────────────────────────
type _GroupInfoResponse =
  ApiPaths['/api/groups/{id}/info']['get']['responses'][200]['content']['application/json'];

export type ContractTypes = {
  resourceList: _ResourceListResponse;
  createResource: _CreateResourceResponse;
  eventList: _EventListResponse;
  userProfile: _UserProfileResponse;
  notificationList: _NotificationListResponse;
  groupInfo: _GroupInfoResponse;
};
