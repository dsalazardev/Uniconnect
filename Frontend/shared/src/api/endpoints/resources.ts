import { TipoContenido } from '../../types/resources';

export const RESOURCES_ENDPOINTS = {
  LIST:    (groupId: number, tipo?: TipoContenido) =>
    `/groups/${groupId}/recursos${tipo ? `?tipo=${tipo}` : ''}`,
  CREATE:  (groupId: number) => `/groups/${groupId}/recursos`,
  GET:     (groupId: number, id: number) => `/groups/${groupId}/recursos/${id}`,
  UPDATE:  (groupId: number, id: number) => `/groups/${groupId}/recursos/${id}`,
  DELETE:  (groupId: number, id: number) => `/groups/${groupId}/recursos/${id}`,
  COMMENT: (groupId: number, id: number) => `/groups/${groupId}/recursos/${id}/comentarios`,
  RATE:    (groupId: number, id: number) => `/groups/${groupId}/recursos/${id}/valoracion`,
};
