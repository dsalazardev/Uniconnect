import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '../services';
import { notificationObserver } from '../services/notification-observer.service';
import type { Notification } from '@uniconnect/shared';

export const useUserNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar notificaciones');
      console.error('Error al cargar notificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar conteo de no leídas
  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (err: any) {
      console.error('Error al cargar conteo de no leídas:', err);
    }
  }, []);

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
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await notificationsService.markAsRead(notificationId);
    } catch (err: any) {
      console.error('Error al marcar como leída:', err);
      // Revertir cambios en caso de error
      loadNotifications();
      loadUnreadCount();
      throw err;
    }
  }, [loadNotifications, loadUnreadCount]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);

      await notificationsService.markAllAsRead();
    } catch (err: any) {
      console.error('Error al marcar todas como leídas:', err);
      // Revertir en caso de error
      loadNotifications();
      loadUnreadCount();
      throw err;
    }
  }, [loadNotifications, loadUnreadCount]);

  // Navegar según tipo de notificación
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      await markAsRead(notification.id_notification);
    }

    const entityId = notification.related_entity_id;

    switch (notification.notification_type) {
      case 'connection_request':
      case 'member_accepted':
        navigate('/connections');
        break;
      case 'message':
      case 'mention':
        if (entityId) {
          navigate(`/messages?groupId=${entityId}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'group_invitation':
      case 'group_invitation_accepted':
      case 'user_joined_group':
      case 'join_request':
      case 'member_removed':
        if (entityId) {
          navigate(`/groups/${entityId}`);
        } else {
          navigate('/groups');
        }
        break;
      default:
        break;
    }
  }, [markAsRead, navigate]);

  // Cargar datos iniciales
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Recargar cuando la app vuelve al foreground (web: visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadUnreadCount]);

  // Suscribirse al observer de notificaciones para recarga automática
  useEffect(() => {
    const unsubscribe = notificationObserver.subscribe(() => {
      loadNotifications();
      loadUnreadCount();
    });

    return unsubscribe;
  }, [loadNotifications, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    handleNotificationPress,
    reloadNotifications: loadNotifications,
    reloadUnreadCount: loadUnreadCount,
  };
};
