import { z } from 'zod';

/**
 * CA5 — Valida una respuesta del backend contra un esquema Zod antes de propagarla a la UI.
 *
 * Uso:
 *   import { validateApiResponse } from '@uniconnect/api-types';
 *   import { ResourceSchema } from '@uniconnect/shared';
 *
 *   const resource = validateApiResponse(ResourceSchema, response.data);
 *   // Si el contrato se rompe → lanza ApiValidationError con detalle de campos
 *
 * @param schema  Esquema Zod que describe la forma esperada
 * @param data    Dato recibido del backend (sin tipado previo)
 * @returns       El dato tipado y validado
 * @throws        ApiValidationError si la validación falla
 */
export function validateApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiValidationError(result.error);
  }
  return result.data;
}

export class ApiValidationError extends Error {
  readonly issues: z.ZodIssue[];

  constructor(error: z.ZodError) {
    super(`[api-types] Respuesta del backend no coincide con el esquema: ${error.message}`);
    this.name = 'ApiValidationError';
    this.issues = error.issues;
  }
}
