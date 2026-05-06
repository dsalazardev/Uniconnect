/**
 * NotificationsService - BFF (Backend for Frontend) layer with Dependency Injection
 * 
 * Handles HTTP communication with the backend API for notifications.
 * Uses injected Axios instance for platform-agnostic HTTP calls.
 */

import type { AxiosInstance } from 'axios';
import type {
  Notification,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  PushTokenPayload,
} from '../types/notifications';
import { NOTIFICATIONS_ENDPOINTS } from '../api/endpoints';

export class NotificationsService {
  private readonly api: AxiosInstance;

  /**
   * Constructor with Dependency Injection
   * @param axiosInstance - Configured Axios instance (injected)
   */
  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  /**
   * Get all notifications for the authenticated user
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await this.api.get(NOTIFICATIONS_ENDPOINTS.GET_USER_NOTIFICATIONS);
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }

  /**
   * Count unread notifications
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await this.api.get(NOTIFICATIONS_ENDPOINTS.GET_UNREAD_COUNT);
      return response.data;
    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<MarkAsReadResponse> {
    try {
      const response = await this.api.patch(NOTIFICATIONS_ENDPOINTS.MARK_AS_READ(notificationId), {});
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    try {
      const response = await this.api.patch(NOTIFICATIONS_ENDPOINTS.MARK_ALL_AS_READ, {});
      return response.data;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Register Expo push token
   */
  async registerExpoPushToken(payload: PushTokenPayload): Promise<unknown> {
    const { data } = await this.api.post(NOTIFICATIONS_ENDPOINTS.REGISTER_EXPO_PUSH_TOKEN, payload);
    return data;
  }

  /**
   * Remove Expo push token
   */
  async removeExpoPushToken(token: string): Promise<unknown> {
    const { data } = await this.api.delete(NOTIFICATIONS_ENDPOINTS.REMOVE_EXPO_PUSH_TOKEN(token));
    return data;
  }
}
