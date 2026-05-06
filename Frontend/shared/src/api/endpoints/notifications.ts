// Notifications API endpoints

export const NOTIFICATIONS_ENDPOINTS = {
  GET_USER_NOTIFICATIONS: '/notifications',
  GET_UNREAD_COUNT: '/notifications/unread-count',
  MARK_AS_READ: (notificationId: number) => `/notifications/${notificationId}/read`,
  MARK_ALL_AS_READ: '/notifications/read-all',
  REGISTER_EXPO_PUSH_TOKEN: '/notifications/expo-push-token',
  REMOVE_EXPO_PUSH_TOKEN: (token: string) => `/notifications/expo-push-token/${token}`,
} as const;
