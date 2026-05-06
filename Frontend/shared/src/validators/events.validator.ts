import { z } from 'zod';
import { createFENResponseSchema } from './fen.validator';

/**
 * Event Type Enum Schema
 */
export const EventTypeSchema = z.enum([
  'CONFERENCIA',
  'TALLER',
  'SEMINARIO',
  'COMPETENCIA',
  'CULTURAL',
  'DEPORTIVO',
]);

/**
 * Event Schema
 * 
 * Esquema de validación para la entidad Event del backend.
 */
export const EventSchema = z.object({
  id_event: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().datetime(), // ISO 8601 datetime string
  time: z.string().min(1),
  location: z.string().min(1),
  type: EventTypeSchema,
  created_by: z.number().int().positive(),
  id_program: z.number().int().positive().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Event Array Schema
 */
export const EventArraySchema = z.array(EventSchema);

/**
 * FEN Response Schemas for Events
 */
export const EventFENResponseSchema = createFENResponseSchema(EventSchema);
export const EventArrayFENResponseSchema = createFENResponseSchema(EventArraySchema);

/**
 * Event Filters Schema
 * 
 * Esquema para validar filtros de búsqueda de eventos.
 */
export const EventFiltersSchema = z.object({
  type: EventTypeSchema.optional(),
  id_program: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  created_by: z.number().int().positive().optional(),
}).optional();

/**
 * Pagination Params Schema
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
}).optional();

/**
 * Create Event DTO Schema
 */
export const CreateEventDTOSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  date: z.string().datetime(),
  time: z.string().min(1),
  location: z.string().min(1).max(200),
  type: EventTypeSchema,
  id_program: z.number().int().positive().nullable().optional(),
});

/**
 * Update Event DTO Schema
 */
export const UpdateEventDTOSchema = CreateEventDTOSchema.partial();

/**
 * Type exports
 */
export type Event = z.infer<typeof EventSchema>;
export type EventType = z.infer<typeof EventTypeSchema>;
export type EventFilters = z.infer<typeof EventFiltersSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type CreateEventDTO = z.infer<typeof CreateEventDTOSchema>;
export type UpdateEventDTO = z.infer<typeof UpdateEventDTOSchema>;
