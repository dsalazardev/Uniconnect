import { z } from 'zod';
import { createFENResponseSchema } from './fen.validator';

export const SessionInstanceStatusSchema = z.enum(['ACTIVE', 'CANCELLED']);
export const AttendanceStatusSchema = z.enum(['CONFIRMED', 'DECLINED', 'PENDING']);
export const RecurrenceTypeSchema = z.enum(['NONE', 'WEEKLY']);

export const StudySessionInstanceSchema = z.object({
  id_instance: z.number().int().positive(),
  id_session: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  scheduled_date: z.string().datetime(),
  duration_minutes: z.number().int().positive(),
  is_recurring: z.boolean(),
  created_by: z.number().int().positive(),
  attendance_count: z.number().int().min(0),
  my_attendance: AttendanceStatusSchema.nullable(),
});

export const StudySessionInstanceArraySchema = z.array(StudySessionInstanceSchema);
export const StudySessionInstanceFENResponseSchema = createFENResponseSchema(StudySessionInstanceSchema);
export const StudySessionInstanceArrayFENResponseSchema = createFENResponseSchema(StudySessionInstanceArraySchema);

export const CreateStudySessionDtoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startDatetime: z.string().datetime(),
  durationMinutes: z.number().int().min(1),
  recurrenceType: RecurrenceTypeSchema,
  recurrenceEndDate: z.string().datetime().optional(),
});

export const UpdateAttendanceDtoSchema = z.object({
  status: AttendanceStatusSchema,
});

export const CancelInstanceResponseSchema = z.object({
  cancelled: z.literal(true),
});

export const AttendanceResponseSchema = z.object({
  id_attendance: z.number().int().positive(),
  status: z.string(),
  updated_at: z.string().datetime(),
});

export type StudySessionInstance = z.infer<typeof StudySessionInstanceSchema>;
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;
export type CreateStudySessionDto = z.infer<typeof CreateStudySessionDtoSchema>;
export type UpdateAttendanceDto = z.infer<typeof UpdateAttendanceDtoSchema>;
