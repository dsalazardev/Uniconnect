import type {
  Resource as ZodResource,
  ResourceDecorators as ZodResourceDecorators,
  TipoContenido as ZodTipoContenido,
  CreateResourcePayload as ZodCreateResourcePayload,
  UpdateResourcePayload as ZodUpdateResourcePayload,
  ProgramaSummary as ZodProgramaSummary,
} from '../validators/resources.validator';

export type TipoContenido = ZodTipoContenido;

export interface ResourceDecorators extends ZodResourceDecorators {}
export interface Resource extends ZodResource {}
export interface CreateResourcePayload extends ZodCreateResourcePayload {}
export interface UpdateResourcePayload extends ZodUpdateResourcePayload {}
export interface ProgramaSummary extends ZodProgramaSummary {}
