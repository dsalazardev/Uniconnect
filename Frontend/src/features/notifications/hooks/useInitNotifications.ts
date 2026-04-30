import { useEffect } from 'react';
import { useNotificationsStore } from '../store/notifications.store';

/**
 * Hook para inicializar el conteo de notificaciones no leídas
 * Debe ser usado en el componente raíz de la app (AppRoot o similar)
 */
export const useInitNotifications = (token: string | null) => {
  const { fetchUnreadCount, setUnreadCount } = useNotificationsStore();

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount(token);
  }, [token, fetchUnreadCount, setUnreadCount]);
};
