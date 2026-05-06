import { useEffect } from 'react';
import { notificationsService } from '../services';
import { notificationsStore } from '../store/notifications.store';

/**
 * Hook para inicializar el conteo de notificaciones no leídas
 * Debe ser usado en el componente raíz de la app (AppRoot o similar)
 */
export const useInitNotifications = () => {
  useEffect(() => {
    const loadInitialCount = async () => {
      try {
        const { count } = await notificationsService.getUnreadCount();
        notificationsStore.setUnreadCount(count);
      } catch (error) {
        console.error('Error al cargar conteo inicial de notificaciones:', error);
        notificationsStore.setUnreadCount(0);
      }
    };

    loadInitialCount();
  }, []);
};
