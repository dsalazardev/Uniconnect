/**
 * @uniconnect/api-types
 *
 * Tipos TypeScript autogenerados desde openapi.json (CA3).
 * Importa y usa estos tipos en web y mobile para obtener
 * seguridad de contrato en tiempo de compilacion (CA4).
 *
 * NUNCA edites openapi.d.ts manualmente — es generado por:
 *   cd packages/api-types && npm run generate
 */

// ── Tipos crudos del spec (CA3) ───────────────────────────────────────────────
export type { paths, operations, components } from './openapi.d';

// ── Aliases de conveniencia por recurso ───────────────────────────────────────
import type { components, operations } from './openapi.d';

/** Respuesta de GET /api/biblioteca/programas/:id/recursos */
export type ApiResource =
  components['schemas'] extends Record<string, unknown>
    ? never
    : // Fallback: tipo inferido desde la operación de lista
      Awaited<operations['BibliotecaController_listarRecursos']['responses'][200]>;

/** Parámetros de query para filtro de recursos */
export type ResourceQueryParams =
  operations['BibliotecaController_listarRecursos']['parameters']['query'];

/** Payload para crear un recurso */
export type CreateResourcePayload =
  operations['BibliotecaController_crearRecurso']['requestBody']['content']['application/json'];

// ── Utilidad de validación Zod (CA5) ─────────────────────────────────────────
// Re-exportada desde @uniconnect/shared para compatibilidad con Metro (mobile)
export { validateApiResponse, ApiValidationError } from './validate';
