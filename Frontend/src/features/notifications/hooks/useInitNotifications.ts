import { useEffect } from 'react';
import { notificationsService } from '../services/notifications.service';
import { useNotificationsStore } from '../store/notifications.store';

/**
 * Hook para inicializar el conteo de notificaciones no leídas
 * Debe ser usado en el componente raíz de la app (AppRoot o similar)
 */
export const useInitNotifications = (token: string | null) => {
  const setUnreadCount = useNotificationsStore(state => state.setUnreadCount);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    const loadInitialCount = async () => {
      try {
        const { count } = await notificationsService.getUnreadCount(token);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error al cargar conteo inicial de notificaciones:', error);
        setUnreadCount(0);
      }
    };

    loadInitialCount();
  }, [token, setUnreadCount]);
};
