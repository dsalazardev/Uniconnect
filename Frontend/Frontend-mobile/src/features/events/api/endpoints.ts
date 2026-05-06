export const EVENTS_ENDPOINTS = {
  GET_EVENTS: '/events',
  CREATE_EVENT: '/events', // ⭐ NUEVO: POST /events
  GET_EVENT_BY_ID: (id: number) => `/events/${id}`,
  UPDATE_EVENT: (id: number) => `/events/${id}`,
  DELETE_EVENT: (id: number) => `/events/${id}`,
};
