import { useEffect, useRef } from 'react';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { notificationsService } from '../services';
import { notificationsStore } from '../store/notifications.store';

/**
 * Hook para inicializar el conteo de notificaciones no leídas
 * Espera a que AuthStore esté listo antes de disparar la petición.
 * Si auth no está listo, reintenta hasta 5 veces con backoff.
 */
export const useInitNotifications = () => {
  const retryCount = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    const loadInitialCount = async () => {
      // Wait for auth to be ready before making the API call
      if (!authStore.isReady) {
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          setTimeout(loadInitialCount, 500 * retryCount.current);
        } else {
          notificationsStore.setUnreadCount(0);
        }
        return;
      }

      try {
        const { count } = await notificationsService.getUnreadCount();
        notificationsStore.setUnreadCount(count);
      } catch (error) {
        // If auth wasn't ready yet, retry with backoff
        const message = error instanceof Error ? error.message : '';
        if (message.includes('Auth not initialized') && retryCount.current < maxRetries) {
          retryCount.current += 1;
          setTimeout(loadInitialCount, 500 * retryCount.current);
        } else {
          console.warn('Error loading initial notification count:', error);
          notificationsStore.setUnreadCount(0);
        }
      }
    };

    loadInitialCount();
  }, []);
};
