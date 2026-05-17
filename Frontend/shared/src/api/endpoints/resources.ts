import { TipoContenido } from '../../types/resources';

export const BIBLIOTECA_ENDPOINTS = {
  MIS_PROGRAMAS:    '/biblioteca/programas',
  LIST_BY_PROGRAM:  (programId: number, tipo?: TipoContenido) =>
    `/biblioteca/programas/${programId}/recursos${tipo ? `?tipo=${tipo}` : ''}`,
  CREATE:           (programId: number) => `/biblioteca/programas/${programId}/recursos`,
  GET:              (id: number) => `/biblioteca/recursos/${id}`,
  UPDATE:           (id: number) => `/biblioteca/recursos/${id}`,
  DELETE:           (id: number) => `/biblioteca/recursos/${id}`,
  COMMENT:          (id: number) => `/biblioteca/recursos/${id}/comentarios`,
  RATE:             (id: number) => `/biblioteca/recursos/${id}/valoracion`,
};
