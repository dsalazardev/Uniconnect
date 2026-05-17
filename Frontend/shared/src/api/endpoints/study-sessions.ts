export const STUDY_SESSION_ENDPOINTS = {
  CREATE_SESSION: (groupId: number) => `/groups/${groupId}/study-sessions`,
  GET_SESSIONS: (groupId: number) => `/groups/${groupId}/study-sessions`,
  DELETE_INSTANCE: (instanceId: number) => `/study-sessions/${instanceId}`,
  UPDATE_ATTENDANCE: (instanceId: number) => `/study-sessions/${instanceId}/attendance`,
} as const;
