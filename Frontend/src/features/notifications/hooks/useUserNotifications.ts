import { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services/notifications.service';
import { notificationObserver } from '../services/notification-observer.service';
import { useNotificationsStore } from '../store/notifications.store';
import { Notification } from '../types';
import { useRouter } from 'expo-router';

interface UseUserNotificationsOptions {
  token: string;
}

export const useUserNotifications = ({ token }: UseUserNotificationsOptions) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { decreaseUnread, resetUnread, fetchUnreadCount } = useNotificationsStore();

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getNotifications(token);
      setNotifications(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar notificaciones');
      console.error('Error al cargar notificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id_notification === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
      decreaseUnread();

      await notificationsService.markAsRead(notificationId, token);
    } catch (err: any) {
      console.error('Error al marcar como leída:', err);
      // Revertir cambios en caso de error
      loadNotifications();
      fetchUnreadCount(token);
      throw err;
    }
  }, [token, loadNotifications, fetchUnreadCount, decreaseUnread]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      resetUnread();

      await notificationsService.markAllAsRead(token);
    } catch (err: any) {
      console.error('Error al marcar todas como leídas:', err);
      // Revertir en caso de error
      loadNotifications();
      fetchUnreadCount(token);
      throw err;
    }
  }, [token, loadNotifications, fetchUnreadCount, resetUnread]);

  // Navegar según tipo de notificación
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      await markAsRead(notification.id_notification);
    }

    // Navegar según el tipo
    switch (notification.notification_type) {
      case 'connection_request':
        router.push('/(tabs)/connections');
        break;

      case 'message':
        router.push('/(tabs)/groups');
        break;

      case 'group_invitation':
        router.push('/(tabs)/connections');
        break;

      case 'group_invitation_accepted':
        router.push('/(tabs)/groups');
        break;

      case 'user_joined_group':
        if (notification.related_entity_id) {
          router.push(`/groups/${notification.related_entity_id}`);
        } else {
          router.push('/(tabs)/groups');
        }
        break;

      case 'group_join_request':
        router.push('/(tabs)/groups');
        break;

      case 'group_join_request_accepted':
        router.push('/(tabs)/groups');
        break;

      case 'group_join_request_rejected':
        router.push('/(tabs)/groups');
        break;

      case 'mention':
        if (notification.related_entity_id) {
          router.push(`/groups/${notification.related_entity_id}` as any);
        } else {
          router.push('/(tabs)/groups');
        }
        break;

      case 'admin_transfer_requested':
        if (notification.related_entity_id) {
          router.push({
            pathname: '/groups/[id]',
            params: {
              id: String(notification.related_entity_id),
              autoOpenInfo: 'true',
              autoOpenAccept: 'true',
            },
          } as any);
        } else {
          router.push('/(tabs)/groups');
        }
        break;
    }
  }, [router, markAsRead]);

  // Cargar datos iniciales
  useEffect(() => {
    if (token) {
      loadNotifications();
    }
  }, [token, loadNotifications]);

  // Suscribirse al observer para recibir notificaciones en tiempo real
  useEffect(() => {
    if (!token) return;

    const unsubscribe = notificationObserver.subscribe(() => {
      fetchUnreadCount(token);
    });

    return unsubscribe;
  }, [token, fetchUnreadCount]);

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    handleNotificationPress,
    reloadNotifications: loadNotifications,
  };
};
