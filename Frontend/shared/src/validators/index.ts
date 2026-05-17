/**
 * Validators Module
 * 
 * Exporta todos los esquemas de validación Zod para el paquete @uniconnect/shared.
 * Estos validadores garantizan que las respuestas del backend cumplan con el formato FEN
 * y que los datos tengan la estructura esperada.
 * 
 * NOTA: Los tipos (Event, Group, etc.) ya están exportados desde ./types
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

// CA5 — Validador de respuestas genérico (compatible con Metro bundler)
export { validateApiResponse, ApiValidationError } from './validate';

// Resources Validators (CA5 — validación de respuestas de biblioteca)
export {
  TipoContenidoSchema,
  ResourceSchema,
  ResourceArraySchema,
  ResourceRatingSchema,
  ResourceCommentSchema,
  ResourceDecoratorsSchema,
} from './resources.validator';
