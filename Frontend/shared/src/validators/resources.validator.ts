import { z } from 'zod';
import { createFENResponseSchema } from './fen.validator';

// ── Enums ─────────────────────────────────────────────────────────────────────
export const TipoContenidoSchema = z.enum([
  'ENLACE',
  'DOCUMENTO',
  'VIDEO',
  'IMAGEN',
  'ARTICULO',
  'OTRO',
]);

// ── Sub-esquemas requeridos por OpenAPI (Mapeados para compatibilidad) ──
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

// ── Decoradores del Sprint 4 (Estructura Base para BD y Frontend) ──────────────
export const ResourceDecoratorsSchema = z.object({
  titulo: z.string().optional(),
  url_externa: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  imagen_preview: z.string().nullable().optional(),
  tipo_contenido: TipoContenidoSchema.optional(),
  creado_por: z.number().int().positive().optional(),
  etiquetas: z.array(z.string()).optional(),
  valoracion: z.object({ promedio: z.number(), total: z.number() }).optional(),
  comentarios: z.array(z.object({
    id_comment: z.number(),
    contenido: z.string(),
    usuario: z.string(),
    fecha: z.string(),
  })).optional(),
});

// ── Entidad principal unificada ────────────────────────────────────────────────
export const ResourceSchema = z.object({
  id_resource: z.number().int().positive(),
  id_program: z.number().int().positive(),
  id_group: z.number().int().positive().nullable(),
  created_by: z.number().int().positive(),
  titulo: z.string(),
  descripcion: z.string().nullable(),
  imagen_preview: z.string().nullable(),
  tipo_contenido: TipoContenidoSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  decoradores: ResourceDecoratorsSchema,
});

export const ResourceArraySchema = z.array(ResourceSchema);
export const ResourceFENResponseSchema = createFENResponseSchema(ResourceSchema);
export const ResourceArrayFENResponseSchema = createFENResponseSchema(ResourceArraySchema);

// ── Payloads adicionales de mutaciones (Sprint 4) ──────────────────────────────
export const CreateResourcePayloadSchema = z.object({
  url_externa: z.string().url().max(2048).optional(),
  titulo: z.string().max(500).optional(),
  descripcion: z.string().max(2000).optional(),
  tipo_contenido: TipoContenidoSchema.default('ENLACE'),
  etiquetas: z.array(z.string()).max(10).optional(),
  id_group: z.number().int().positive().optional(),
});

export const UpdateResourcePayloadSchema = z.object({
  titulo: z.string().max(500).optional(),
  descripcion: z.string().max(2000).optional(),
  tipo_contenido: TipoContenidoSchema.optional(),
  etiquetas: z.array(z.string()).max(10).optional(),
});

export const AddCommentSchema = z.object({
  contenido: z.string().max(1000),
});

export const RateResourceSchema = z.object({
  valor: z.number().int().min(1).max(5),
});

export const CommentResponseSchema = z.object({
  id_comment: z.number().int().positive(),
  id_resource: z.number().int().positive(),
  id_user: z.number().int().positive(),
  contenido: z.string(),
  created_at: z.coerce.date(),
  user: z.object({ id_user: z.number().int().positive(), full_name: z.string() }),
});

export const RatingResponseSchema = z.object({
  id_rating: z.number().int().positive(),
  id_resource: z.number().int().positive(),
  id_user: z.number().int().positive(),
  valor: z.number().int().min(1).max(5),
});

export const DeleteResourceResponseSchema = z.object({
  message: z.string(),
});

export const ProgramaSummarySchema = z.object({
  id_program: z.number().int().positive(),
  name: z.string(),
});

export const ProgramaSummaryArraySchema = z.array(ProgramaSummarySchema);

// ── Type exports integrados de ambos mundos ────────────────────────────────────
export type Resource = z.infer<typeof ResourceSchema>;
export type ResourceDecorators = z.infer<typeof ResourceDecoratorsSchema>;
export type TipoContenido = z.infer<typeof TipoContenidoSchema>;
export type CreateResourcePayload = z.infer<typeof CreateResourcePayloadSchema>;
export type UpdateResourcePayload = z.infer<typeof UpdateResourcePayloadSchema>;
export type ProgramaSummary = z.infer<typeof ProgramaSummarySchema>;

// Alias requeridos para OpenAPI de tu compañero
export type ResourceValidated = Resource;
export type TipoContenidoValidated = TipoContenido;