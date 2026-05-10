import type { AxiosInstance } from 'axios';
import {
  NotificationsService as SharedNotificationsService,
  type Notification,
  type UnreadCountResponse,
  type MarkAsReadResponse,
  type MarkAllAsReadResponse,
  type PushTokenPayload,
} from '@uniconnect/shared';
import type {
  NotificationPreference,
  UpdatePreferencePayload,
  UpdatePreferenceResponse,
} from '../types';

const notificationsEndpoints = {
  getPreferencias: () => '/notifications/preferencias',
  updatePreferencia: () => '/notifications/preferencias',
};

export class WebNotificationsService {
  private readonly api: AxiosInstance;
  private readonly shared: SharedNotificationsService;

  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
    this.shared = new SharedNotificationsService(axiosInstance);
  }

  getNotifications(): Promise<Notification[]> {
    return this.shared.getNotifications();
  }

  getUnreadCount(): Promise<UnreadCountResponse> {
    return this.shared.getUnreadCount();
  }

  markAsRead(notificationId: number): Promise<MarkAsReadResponse> {
    return this.shared.markAsRead(notificationId);
  }

  markAllAsRead(): Promise<MarkAllAsReadResponse> {
    return this.shared.markAllAsRead();
  }

  registerExpoPushToken(payload: PushTokenPayload): Promise<unknown> {
    return this.shared.registerExpoPushToken(payload);
  }

  removeExpoPushToken(token: string): Promise<unknown> {
    return this.shared.removeExpoPushToken(token);
  }

  async getPreferencias(token: string): Promise<NotificationPreference[]> {
    const response = await this.api.get(notificationsEndpoints.getPreferencias(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async updatePreferencia(
    payload: UpdatePreferencePayload,
    token: string,
  ): Promise<UpdatePreferenceResponse> {
    const response = await this.api.patch(notificationsEndpoints.updatePreferencia(), payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}
