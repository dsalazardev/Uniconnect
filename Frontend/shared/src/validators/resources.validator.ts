import { z } from 'zod';
import { createFENResponseSchema } from './fen.validator';

export const TipoContenidoSchema = z.enum([
  'ENLACE',
  'DOCUMENTO',
  'VIDEO',
  'IMAGEN',
  'ARTICULO',
  'OTRO',
]);

export const ResourceDecoratorsSchema = z.object({
  titulo: z.string(),
  url_externa: z.string().nullable(),
  descripcion: z.string().nullable(),
  imagen_preview: z.string().nullable(),
  tipo_contenido: TipoContenidoSchema,
  creado_por: z.number().int().positive(),
  etiquetas: z.array(z.string()).optional(),
  valoracion: z.object({ promedio: z.number(), total: z.number() }).optional(),
  comentarios: z.array(z.object({
    id_comment: z.number(),
    contenido: z.string(),
    usuario: z.string(),
    fecha: z.string(),
  })).optional(),
});

export const ResourceSchema = z.object({
  id_resource: z.number().int().positive(),
  id_program: z.number().int().positive(),
  id_group: z.number().int().positive().nullable(),
  created_by: z.number().int().positive(),
  creator: z.object({
    id_user: z.number().int().positive(),
    full_name: z.string(),
    picture: z.string().nullable(),
  }),
  url_externa: z.string().nullable(),
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

export type Resource = z.infer<typeof ResourceSchema>;
export type ResourceDecorators = z.infer<typeof ResourceDecoratorsSchema>;
export type TipoContenido = z.infer<typeof TipoContenidoSchema>;
export type CreateResourcePayload = z.infer<typeof CreateResourcePayloadSchema>;
export type UpdateResourcePayload = z.infer<typeof UpdateResourcePayloadSchema>;
export type ProgramaSummary = z.infer<typeof ProgramaSummarySchema>;
