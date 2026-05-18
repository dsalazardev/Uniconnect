/**
 * Validators Module
 * * Exporta todos los esquemas de validación Zod para el paquete @uniconnect/shared.
 * Estos validadores garantizan que las respuestas del backend cumplan con el formato FEN
 * y que los datos tengan la estructura esperada.
 * * NOTA: Los tipos (Event, Group, etc.) ya están exportados desde ./types
 * Aquí solo exportamos los esquemas Zod y funciones de validación.
 */

// FEN Response Validators
export {
  createFENResponseSchema,
  BaseFENResponseSchema,
  validateFENResponse,
  safeFENResponseValidation,
} from './fen.validator';

// Events Validators (solo esquemas, no tipos)
export {
  EventTypeSchema,
  EventSchema,
  EventArraySchema,
  EventFENResponseSchema,
  EventArrayFENResponseSchema,
  EventFiltersSchema,
  PaginationParamsSchema,
  CreateEventDTOSchema,
  UpdateEventDTOSchema,
} from './events.validator';

// Groups Validators (solo esquemas, no tipos)
export {
  GroupSchema,
  MembershipSchema,
  GroupInvitationSchema,
  GroupJoinRequestSchema,
  GroupArraySchema,
  MembershipArraySchema,
  GroupInvitationArraySchema,
  GroupJoinRequestArraySchema,
  GroupFENResponseSchema,
  GroupArrayFENResponseSchema,
  MembershipFENResponseSchema,
  MembershipArrayFENResponseSchema,
  GroupInvitationFENResponseSchema,
  GroupInvitationArrayFENResponseSchema,
  GroupJoinRequestFENResponseSchema,
  GroupJoinRequestArrayFENResponseSchema,
  CreateGroupDTOSchema,
  UpdateGroupDTOSchema,
  InviteUserDTOSchema,
  RespondInvitationDTOSchema,
  TransferOwnershipDTOSchema,
} from './groups.validator';

// === INTEGRACIÓN DE CONFIGURACIÓN OPENAPI Y SPRINT 4 ===

// CA5 — Validador de respuestas genérico (compatible con Metro bundler)
export { validateApiResponse, ApiValidationError } from './validate';

// Resources Validators (Sprint 4 + OpenAPI CA5)
export {
  TipoContenidoSchema,
  ResourceDecoratorsSchema,
  ResourceSchema,
  ResourceArraySchema,
  ResourceFENResponseSchema,
  ResourceArrayFENResponseSchema,
  CreateResourcePayloadSchema,
  UpdateResourcePayloadSchema,
  AddCommentSchema,
  RateResourceSchema,
  CommentResponseSchema,
  RatingResponseSchema,
  DeleteResourceResponseSchema,
  ProgramaSummarySchema,
  ProgramaSummaryArraySchema,
  ResourceRatingSchema,   // Requerido por OpenAPI
  ResourceCommentSchema,  // Requerido por OpenAPI
} from './resources.validator';

// Forum Validators (Sprint 4)
export {
  ForumQuestionStatusSchema,
  ForumVoteEntityTypeSchema,
  ForumQuestionSchema,
  ForumQuestionArraySchema,
  ForumQuestionFENResponseSchema,
  ForumQuestionArrayFENResponseSchema,
  ForumAnswerSchema,
  ForumAnswerArraySchema,
  ForumAnswerFENResponseSchema,
  ForumAnswerArrayFENResponseSchema,
  CreateQuestionDtoSchema,
  CreateAnswerDtoSchema,
  ForumVoteDtoSchema,
} from './forum.validator';

// Study Sessions Validators (Sprint 4)
export {
  SessionInstanceStatusSchema,
  AttendanceStatusSchema,
  RecurrenceTypeSchema,
  StudySessionInstanceSchema,
  StudySessionInstanceArraySchema,
  StudySessionInstanceFENResponseSchema,
  StudySessionInstanceArrayFENResponseSchema,
  CreateStudySessionDtoSchema,
  UpdateAttendanceDtoSchema,
  CancelInstanceResponseSchema,
  AttendanceResponseSchema,
} from './study-sessions.validator';

// Polls Validators (Sprint 4)
export {
  PollStatusSchema,
  PollOptionSchema,
  PollOptionArraySchema,
  PollSchema,
  PollArraySchema,
  PollFENResponseSchema,
  PollArrayFENResponseSchema,
  CreatePollDtoSchema,
  CastVoteDtoSchema,
  PollVoteUpdatedPayloadSchema,
  PollClosedPayloadSchema,
} from './polls.validator';