import { API_BASE_URL } from '@/src/constants/api';

export const notificationsEndpoints = {
  // Obtener todas las notificaciones del usuario (usa JWT para identificar usuario)
  getUserNotifications: () => `${API_BASE_URL}/notifications`,
  
  // Contar notificaciones no leídas (usa JWT para identificar usuario)
  getUnreadCount: () => `${API_BASE_URL}/notifications/unread-count`,
  
  // Marcar notificación como leída
  markAsRead: (notificationId: number) =>
    `${API_BASE_URL}/notifications/${notificationId}/read`,
  
  // Marcar todas como leídas (usa JWT para identificar usuario)
  markAllAsRead: () => `${API_BASE_URL}/notifications/read-all`,
  
  // Expo Push Token (mantener compatibilidad)
  registerExpoPushToken: () =>
    `${API_BASE_URL}/notifications/expo-push-token`,
  
  removeExpoPushToken: (token: string) =>
    `${API_BASE_URL}/notifications/expo-push-token/${token}`,

  getPreferencias: () => `${API_BASE_URL}/notifications/preferencias`,
  updatePreferencia: () => `${API_BASE_URL}/notifications/preferencias`,
};