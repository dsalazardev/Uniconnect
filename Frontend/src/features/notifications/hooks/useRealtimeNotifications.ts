import { useEffect } from 'react';
import { authStore } from '@/src/features/auth';
import { websocketService } from '@/src/features/messages/services/websocket.service';
import { notificationObserver } from '../services/notification-observer.service';

/**
 * Hook para escuchar notificaciones en tiempo real vía WebSocket
 * 
 * Este hook NO inicia una conexión WebSocket propia. En su lugar, se
 * aprovecha de la conexión existente del chat cuando el usuario está
 * en un grupo. Si el WebSocket está conectado, registra un listener
 * para el evento 'notification:new' que actualiza el badge automáticamente.
 * 
 * Cuando el usuario NO está en un chat, las notificaciones se actualizan
 * mediante otros mecanismos (AppState listener, manual refresh).
 */
export const useRealtimeNotifications = () => {
  useEffect(() => {
    // Solo registrar listener si está autenticado Y el WebSocket ya está conectado
    if (!authStore.isAuthenticated || !authStore.user) {
      return;
    }

    // Handler para nuevas notificaciones
    const handleNotification = (data: any) => {
      console.log('Nueva notificación recibida vía WebSocket:', data);
      // Notificar al observer para actualizar el badge
      notificationObserver.notify();
    };

    // Registrar listener (solo funciona si WebSocket ya está conectado desde el chat)
    websocketService.onNotificationReceived(handleNotification);

    // Cleanup: remover listener al desmontar
    return () => {
      websocketService.off('notification:new', handleNotification);
    };
  }, []);
};

/**
 * NOTA TÉCNICA:
 * 
 * El WebSocket service está diseñado para conexiones de chat grupales
 * que requieren autenticación con id_user + id_group. Por eso, este hook
 * NO intenta establecer su propia conexión WebSocket global.
 * 
 * Las notificaciones en tiempo real funcionan cuando:
 * 1. Usuario está en un chat de grupo (WebSocket conectado)
 * 2. Backend emite evento 'notification:new' cuando crea notificaciones
 * 3. Este listener actualiza el badge instantáneamente
 * 
 * Cuando NO está en un chat:
 * - Badge se actualiza al abrir la app (useInitNotifications)
 * - Badge se actualiza al volver a foreground (AppState listener)
 */
