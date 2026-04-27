import axios from 'axios';
import { api } from '@/src/constants/api';
import { notificationsEndpoints } from '../api/endpoints';
import { notificationObserver } from './notification-observer.service';
import { Notification, UnreadCountResponse, MarkAsReadResponse, MarkAllAsReadResponse, PushTokenPayload } from '../types';

class NotificationsService {
  /**
   * Obtener todas las notificaciones del usuario autenticado
   */
  async getNotifications(token: string): Promise<Notification[]> {
    try {
      const response = await axios.get(notificationsEndpoints.getUserNotifications(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }

  /**
   * Contar notificaciones no leídas
   */
  async getUnreadCount(token: string): Promise<UnreadCountResponse> {
    try {
      const response = await axios.get(notificationsEndpoints.getUnreadCount(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: number, token: string): Promise<MarkAsReadResponse> {
    try {
      const response = await axios.patch(notificationsEndpoints.markAsRead(notificationId), {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Notificar al observer que hay cambios
      notificationObserver.notify();
      
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(token: string): Promise<MarkAllAsReadResponse> {
    try {
      const response = await axios.patch(notificationsEndpoints.markAllAsRead(), {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Notificar al observer que hay cambios
      notificationObserver.notify();
      
      return response.data;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  // Mantener compatibilidad con api instance para push tokens
  async registerExpoPushToken(payload: PushTokenPayload) {
    const { data } = await api.post(notificationsEndpoints.registerExpoPushToken(), payload);
    return data;
  }

  async removeExpoPushToken(token: string) {
    const { data } = await api.delete(notificationsEndpoints.removeExpoPushToken(token));
    return data;
  }
}

export const notificationsService = new NotificationsService();
export default NotificationsService;