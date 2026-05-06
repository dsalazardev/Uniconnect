import { z } from 'zod';

/**
 * FEN (Frontend-Esperado-Normalizado) Response Schema
 * 
 * Esquema genérico para validar respuestas del backend que siguen el formato FEN.
 * Todas las respuestas del API deben cumplir con esta estructura.
 */

// Error schema
const FENErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
}).nullable();

// Metadata schema (opcional)
const FENMetadataSchema = z.object({
  total: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  hasNextPage: z.boolean().optional(),
  hasPreviousPage: z.boolean().optional(),
  timestamp: z.string(),
}).optional();

/**
 * Generic FEN Response Schema
 * @template T - Type of the data payload
 */
export const createFENResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    success: z.boolean(),
    data: z.union([dataSchema, z.null()]),
    error: FENErrorSchema,
    metadata: FENMetadataSchema,
  });
};

/**
 * Base FEN Response Schema (without data validation)
 * Útil para validar estructura básica sin validar el contenido de data
 */
export const BaseFENResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().nullable(),
  error: FENErrorSchema,
  metadata: FENMetadataSchema,
});

/**
 * Validate FEN Response
 * 
 * Valida que una respuesta del backend cumpla con el formato FEN.
 * 
 * @param data - Datos a validar
 * @param dataSchema - Esquema Zod opcional para validar el campo data
 * @returns Objeto validado o lanza ZodError
 * 
 * @example
 * // Validar solo estructura FEN básica
 * const response = validateFENResponse(data);
 * 
 * @example
 * // Validar estructura FEN + data específica
 * const response = validateFENResponse(data, EventSchema);
 */
export function validateFENResponse(
  data: unknown,
  dataSchema?: z.ZodTypeAny
): z.infer<typeof BaseFENResponseSchema> | z.infer<ReturnType<typeof createFENResponseSchema>> {
  if (dataSchema) {
    const schema = createFENResponseSchema(dataSchema);
    return schema.parse(data);
  }
  
  return BaseFENResponseSchema.parse(data);
}

/**
 * Safe FEN Response Validation
 * 
 * Versión segura de validateFENResponse que retorna un objeto con success/error
 * en lugar de lanzar excepciones.
 * 
 * @param data - Datos a validar
 * @param dataSchema - Esquema Zod opcional para validar el campo data
 * @returns Objeto con success y data/error
 */
export function safeFENResponseValidation<T>(
  data: unknown,
  dataSchema?: z.ZodTypeAny
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const validated = validateFENResponse(data, dataSchema);
    return { success: true, data: validated as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}
