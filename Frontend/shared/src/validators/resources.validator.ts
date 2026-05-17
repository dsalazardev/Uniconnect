import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────
export const TipoContenidoSchema = z.enum([
  'ENLACE', 'DOCUMENTO', 'VIDEO', 'IMAGEN', 'ARTICULO', 'OTRO',
]);

// ── Sub-esquemas del decorador ────────────────────────────────────────────────
export const ResourceRatingSchema = z.object({
  promedio: z.number(),
  total: z.number().int().nonnegative(),
});

export const ResourceCommentSchema = z.object({
  id: z.number().int().positive(),
  contenido: z.string(),
  autor: z.string(),
  created_at: z.string(),
});

export const ResourceDecoratorsSchema = z.object({
  etiquetas: z.array(z.string()).optional(),
  valoracion: ResourceRatingSchema.optional(),
  comentarios: z.array(ResourceCommentSchema).optional(),
  imagen_preview: z.string().url().nullable().optional(),
});

// ── Entidad principal ─────────────────────────────────────────────────────────
export const ResourceSchema = z.object({
  id_resource: z.number().int().positive(),
  id_program: z.number().int().positive(),
  id_group: z.number().int().positive().nullable(),
  created_by: z.number().int().positive(),
  url_externa: z.string().url().nullable(),
  titulo: z.string().min(1),
  descripcion: z.string().nullable(),
  imagen_preview: z.string().nullable(),
  tipo_contenido: TipoContenidoSchema,
  created_at: z.string(),
  updated_at: z.string(),
  decoradores: ResourceDecoratorsSchema,
});

export const ResourceArraySchema = z.array(ResourceSchema);

// ── Type exports ──────────────────────────────────────────────────────────────
export type ResourceValidated = z.infer<typeof ResourceSchema>;
export type TipoContenidoValidated = z.infer<typeof TipoContenidoSchema>;
