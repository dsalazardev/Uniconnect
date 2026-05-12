export const POLLS_ENDPOINTS = {
  CREATE_POLL: (groupId: number) => `/groups/${groupId}/polls`,
  CAST_VOTE: (pollId: number) => `/polls/${pollId}/vote`,
  GET_POLL: (pollId: number) => `/polls/${pollId}`,
} as const;
