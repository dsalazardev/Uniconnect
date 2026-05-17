import { z } from 'zod';

/**
 * CA5 — Valida una respuesta del backend contra un esquema Zod antes de propagarla a la UI.
 * Disponible desde @uniconnect/shared para compatibilidad con Metro bundler (mobile).
 *
 * @throws ApiValidationError si la validación falla
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
    super(`[api] Respuesta del backend no coincide con el esquema: ${error.message}`);
    this.name = 'ApiValidationError';
    this.issues = error.issues;
  }
}
