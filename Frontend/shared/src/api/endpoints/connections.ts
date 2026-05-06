// Connections API endpoints

export const CONNECTIONS_ENDPOINTS = {
  PENDING_REQUESTS: '/connections/pending',
  MY_CONNECTIONS: '/connections',
  SEND_REQUEST: '/connections/request',
  ACCEPT_REQUEST: (id: number) => `/connections/${id}/accept`,
  REJECT_REQUEST: (id: number) => `/connections/${id}/reject`,
  CANCEL_REQUEST: (id: number) => `/connections/${id}/cancel`,
  DELETE_CONNECTION: (id: number) => `/connections/${id}`,
  GET_STATUS: '/connections/status',
} as const;
