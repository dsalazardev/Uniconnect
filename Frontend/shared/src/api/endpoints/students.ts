// Students API endpoints

export const STUDENTS_ENDPOINTS = {
  GET_ALL: '/users',
  GET_COURSES: '/courses',
  GET_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  GET_STUDENT_PROFILE: (id: number) => `/users/profile/${id}`,
  GET_CONNECTED_COMMUNITY: '/users/community/connected',
  GET_NOT_CONNECTED_COMMUNITY: '/users/community/not-connected',
  // US-D02: Decorator pattern endpoints
  GET_PERFIL_BASE: (id: number) => `/perfil/${id}`,
  GET_PERFIL_COMPLETO: (id: number) => `/perfil/${id}?vista=completa`,
} as const;
