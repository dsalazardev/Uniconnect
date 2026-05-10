import { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services';
import { notificationObserver } from '../services/notification-observer.service';
import { Notification } from '../types';
import { useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';

export const useUserNotifications = () => {
  const router = useRouter();
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

    // Navegar según el tipo
    switch (notification.notification_type) {
      case 'connection_request':
        router.push('/(tabs)/connections');
        break;

      case 'message':
        if (notification.related_entity_id) {
          router.push(`/groups/${notification.related_entity_id}` as any);
        } else {
          router.push('/(tabs)/groups');
        }
        break;

      case 'group_invitation':
        router.push('/(tabs)/connections?tab=invitaciones' as any);
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

      case 'join_request':
        // El owner recibe esto: ir a la pantalla de grupos para gestionar solicitudes
        router.push('/(tabs)/groups');
        break;

      case 'member_accepted':
        // El owner aceptó tu solicitud: ir a Mis Grupos
        router.push('/(tabs)/groups');
        break;

      case 'member_removed':
        // El owner eliminó tu membresía: ir a Mis Grupos
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
        // El candidato recibe esto: ir al grupo con el modal para aceptar/rechazar
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

      case 'admin_transfer_accepted':
        // El owner anterior recibe esto: la transferencia se completó
        if (notification.related_entity_id) {
          router.push(`/groups/${notification.related_entity_id}` as any);
        } else {
          router.push('/(tabs)/groups');
        }
        break;

      case 'admin_transfer_declined':
        // El owner recibe esto: el candidato rechazó, volver a gestionar el grupo
        if (notification.related_entity_id) {
          router.push(`/groups/${notification.related_entity_id}` as any);
        } else {
          router.push('/(tabs)/groups');
        }
        break;
    }
  }, [router, markAsRead]);

  // Cargar datos iniciales
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Recargar cuando la app vuelve al foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [loadUnreadCount]);

  // Suscribirse al observer para recibir notificaciones en tiempo real
  useEffect(() => {
    const unsubscribe = notificationObserver.subscribe(() => {
      // Cuando se notifica un cambio, recargar el conteo
      loadUnreadCount();
    });

    return unsubscribe;
  }, [loadUnreadCount]);

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
