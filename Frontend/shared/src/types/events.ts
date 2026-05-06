// Event types

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
  date: string;
  time: string;
  location: string;
  type: EventType;
  created_by: number;
  id_program?: number | null;
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

export interface CreateEventPayload {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: EventType;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  type?: EventType;
}

export interface EventFilters {
  date?: string | null;
  type?: EventType | null;
  startDate?: string | null;
  endDate?: string | null;
}
