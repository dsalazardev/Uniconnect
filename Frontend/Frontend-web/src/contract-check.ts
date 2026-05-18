/**
 * CA4 — Verificación de contrato en tiempo de compilación.
 *
 * Este archivo NO se importa en runtime. Su único propósito es que
 * `tsc` falle si el backend cambia el contrato de algún endpoint
 * sin que el frontend actualice su código.
 *
 * Si `npm run type-check` pasa → el contrato está vigente.
 * Si falla → algún campo fue renombrado/eliminado en el backend.
 *
 * Para añadir un endpoint nuevo al chequeo:
 *   type MiRespuesta = ApiPaths['/api/ruta']['get']['responses'][200]['content']['application/json'];
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

type _CreateEventBody =
  ApiPaths['/api/events']['post']['requestBody']['content']['application/json'];

// ── Usuarios ──────────────────────────────────────────────────────────────────
type _UserProfileResponse =
  ApiPaths['/api/users/profile']['get']['responses'][200]['content']['application/json'];

// ── Notificaciones ────────────────────────────────────────────────────────────
type _NotificationListResponse =
  ApiPaths['/api/notifications']['get']['responses'][200]['content']['application/json'];

// ── Grupos ────────────────────────────────────────────────────────────────────
type _GroupInfoResponse =
  ApiPaths['/api/groups/{id}/info']['get']['responses'][200]['content']['application/json'];

// Marca las variables como usadas para evitar warnings del compilador
export type ContractTypes = {
  resourceList: _ResourceListResponse;
  createResource: _CreateResourceResponse;
  eventList: _EventListResponse;
  createEvent: _CreateEventBody;
  userProfile: _UserProfileResponse;
  notificationList: _NotificationListResponse;
  groupInfo: _GroupInfoResponse;
};
