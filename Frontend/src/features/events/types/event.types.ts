// Event Types for Frontend
export enum EventType {
  CONFERENCIA = 'CONFERENCIA',
  TALLER = 'TALLER',
  SEMINARIO = 'SEMINARIO',
  COMPETENCIA = 'COMPETENCIA',
  CULTURAL = 'CULTURAL',
  DEPORTIVO = 'DEPORTIVO'
}

export interface Event {
  id_event: number;
  title: string;
  description: string;
  date: string; // ISO string from backend
  time: string;
  location: string;
  type: EventType;
  created_by: number;
  id_program?: number | null; // ⭐ NUEVO: ID de la carrera/programa
  createdAt: string;
  updatedAt: string;
  creator?: {
    id_user: number;
    full_name: string;
    email?: string;
    picture?: string;
  };
  program?: {
    id_program: number;
    name: string;
  };
}

// ⭐ NUEVO: Payload para crear eventos (sin id_program, se toma del JWT)
export interface CreateEventPayload {
  title: string;
  description: string;
  date: string; // ISO string (YYYY-MM-DD)
  time: string; // HH:MM
  location: string;
  type: EventType;
}

// ⭐ NUEVO: Payload para actualizar eventos
export interface UpdateEventPayload {
  title?: string;
  description?: string;
  date?: string; // ISO string (YYYY-MM-DD)
  time?: string; // HH:MM
  location?: string;
  type?: EventType;
}

export interface EventFilters {
  date?: string | null;
  type?: EventType | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface Metadata {
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  timestamp?: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
}

export interface FENResponse<T> {
  success: boolean;
  data: T | null;
  error: ErrorDetails | null;
  metadata: Metadata;
}
