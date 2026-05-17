/**
 * @uniconnect/api-types
 *
 * Tipos TypeScript y schemas Zod AUTOGENERADOS desde openapi.json.
 *
 * NUNCA edites openapi.d.ts ni schemas.ts manualmente — son generados por:
 *   cd packages/api-types && npm run generate
 *
 * Flujo completo tras cambiar un endpoint:
 *   1. cd Backend && npm run generate:openapi
 *   2. cd packages/api-types && npm run generate
 *   3. npm run typecheck:all  (desde raíz del monorepo)
 */

// ── Tipos TypeScript del spec (CA3/CA4) ───────────────────────────────────────
export type { paths, operations, components } from './openapi.d';

// ── Schemas Zod autogenerados (CA5) ──────────────────────────────────────────
// Generados por openapi-zod-client desde openspec/openapi.json
// Equivalen 1:1 a los DTOs del backend.
export {
  // Auth
  GoogleLoginDto,
  TempLoginDto,
  Auth0CallbackDto,
  RefreshTokenDto,
  // Usuarios
  ProfileUpdateDto,
  CompleteOnboardingDto,
  // Recursos / Biblioteca
  CreateResourceDto,
  // Eventos
  CreateEventDto,
  // Grupos
  CreateGroupDto,
  UpdateGroupDto,
  // Membresías
  CreateMembershipDto,
  // Notificaciones
  ExpoPushTokenDto,
  PreferenciaCanalDto,
  // Sesiones de estudio
  CreateStudySessionDto,
} from './schemas';

// ── Utilidad de validación Zod (CA5) ─────────────────────────────────────────
export { validateApiResponse, ApiValidationError } from './validate';
