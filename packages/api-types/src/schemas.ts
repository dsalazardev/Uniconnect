import { z } from "zod";

export const GoogleLoginDto = z
  .object({ access_token: z.string() })
  .passthrough();
export const TempLoginDto = z.object({ googleSub: z.string() }).passthrough();
export const Auth0CallbackDto = z
  .object({
    code: z.string(),
    redirect_uri: z.string(),
    code_verifier: z.string(),
  })
  .passthrough();
export const RefreshTokenDto = z
  .object({ refresh_token: z.string(), user_id: z.number() })
  .passthrough();
export const LogoutDto = z.object({ access_token: z.string() }).passthrough();
export const ProfileUpdateDto = z
  .object({
    current_semester: z.string().nullable(),
    image: z.string().nullable(),
    phone: z.string().nullable(),
  })
  .partial()
  .passthrough();
export const CompleteOnboardingDto = z
  .object({
    id_program: z.number().gte(1),
    current_semester: z.number().gte(1),
  })
  .passthrough();
export const CreateCourseDto = z
  .object({ name: z.string(), id_program: z.number().optional() })
  .passthrough();
export const CreateProgramDto = z.object({ name: z.string() }).passthrough();
export const CreateEnrollmentDto = z
  .object({ id_course: z.number(), status: z.string().optional() })
  .passthrough();
export const CreateGroupDto = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    id_course: z.number(),
  })
  .passthrough();
export const UpdateGroupDto = z
  .object({ name: z.string(), description: z.string(), id_course: z.number() })
  .partial()
  .passthrough();
export const CreateMessageDto = z.object({}).partial().passthrough();
export const UpdateMessageDto = z.object({}).partial().passthrough();
export const ExpoPushTokenDto = z
  .object({
    token: z.string().max(255),
    platform: z.enum(["android", "ios", "web"]).optional(),
  })
  .passthrough();
export const PreferenciaCanalDto = z
  .object({
    tipo_evento: z.string().max(100),
    canal: z.string().max(100),
    activo: z.boolean(),
  })
  .passthrough();
export const CreateConnectionDto = z.object({}).partial().passthrough();
export const CreateMembershipDto = z
  .object({
    id_user: z.number().gte(1),
    id_group: z.number().gte(1),
    is_admin: z.boolean().optional(),
    joined_at: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
export const UpdateMembershipDto = z.object({}).partial().passthrough();
export const CreateGroupInvitationDto = z
  .object({
    id_group: z.number(),
    inviter_id: z.number(),
    invitee_id: z.number(),
  })
  .passthrough();
export const RespondGroupInvitationDto = z
  .object({ status: z.enum(["accepted", "rejected"]) })
  .passthrough();
export const FilesController_uploadFiles_Body = z
  .object({
    files: z.array(z.instanceof(File)),
    id_group: z.string(),
    id_message: z.string().optional(),
  })
  .passthrough();
export const CreateEventDto = z
  .object({
    id_category: z.number(),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    start_date: z.string(),
    end_date: z.string(),
  })
  .passthrough();
export const CreatePollDto = z
  .object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(10),
    closesAt: z.string(),
  })
  .passthrough();
export const CastVoteDto = z.object({ optionId: z.number() }).passthrough();
export const CreateQuestionDto = z
  .object({ title: z.string(), body: z.string() })
  .passthrough();
export const CreateAnswerDto = z.object({ body: z.string() }).passthrough();
export const CreateStudySessionDto = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    startDatetime: z.string(),
    durationMinutes: z.number(),
    recurrenceType: z.enum(["NONE", "WEEKLY"]).default("NONE"),
    recurrenceEndDate: z.string().optional(),
  })
  .passthrough();
export const UpdateAttendanceDto = z
  .object({ status: z.enum(["CONFIRMED", "DECLINED", "PENDING"]) })
  .passthrough();
export const CreateResourceDto = z
  .object({
    url_externa: z.string(),
    titulo: z.string(),
    descripcion: z.string(),
    tipo_contenido: z
      .enum(["ENLACE", "DOCUMENTO", "VIDEO", "IMAGEN", "ARTICULO", "OTRO"])
      .default("ENLACE"),
    etiquetas: z.array(z.string()),
    id_group: z.number(),
  })
  .partial()
  .passthrough();
export const UpdateResourceDto = z
  .object({
    titulo: z.string(),
    descripcion: z.string(),
    tipo_contenido: z.enum([
      "ENLACE",
      "DOCUMENTO",
      "VIDEO",
      "IMAGEN",
      "ARTICULO",
      "OTRO",
    ]),
    etiquetas: z.array(z.string()),
  })
  .partial()
  .passthrough();
export const AddCommentDto = z.object({ contenido: z.string() }).passthrough();
export const RateResourceDto = z
  .object({ valor: z.number().gte(1).lte(5) })
  .passthrough();
