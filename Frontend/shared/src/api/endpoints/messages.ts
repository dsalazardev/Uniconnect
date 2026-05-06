// Messages API endpoints

export const MESSAGES_ENDPOINTS = {
  GET_RECENT_MESSAGES: (groupId: number, limit: number = 50, beforeId?: number) => {
    const base = `/messages/group/${groupId}/recent?limit=${limit}`;
    return beforeId ? `${base}&beforeId=${beforeId}` : base;
  },
  SEARCH_MESSAGES: (groupId: number, query: string) => `/messages/group/${groupId}/search?query=${encodeURIComponent(query)}`,
  COUNT_MESSAGES: (groupId: number) => `/messages/group/${groupId}/count`,
  GET_LAST_MESSAGE: (groupId: number) => `/messages/group/${groupId}/last`,
  EDIT_MESSAGE: (messageId: number) => `/messages/${messageId}/edit`,
  DELETE_MESSAGE: (messageId: number) => `/messages/${messageId}`,
} as const;
