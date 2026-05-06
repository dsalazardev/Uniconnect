export const CONNECTION_ENDPOINTS = {
  PENDING_REQUESTS: '/connections/pending',
  MY_CONNECTIONS: '/connections',
  SEND_REQUEST: '/connections/request',
  ACCEPT_REQUEST: '/connections/:id/accept',
  REJECT_REQUEST: '/connections/:id/reject',
  CANCEL_REQUEST: '/connections/:id/cancel',
  DELETE_CONNECTION: '/connections/:id',
  GET_STATUS: '/connections/status',
} as const;