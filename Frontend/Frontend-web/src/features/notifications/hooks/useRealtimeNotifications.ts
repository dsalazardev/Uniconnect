import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { authStore } from '@/features/auth/store/AuthStore';
import { notificationObserver } from '../services/notification-observer.service';

const getWsUrl = () => import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8007';

/**
 * Hook para escuchar notificaciones en tiempo real vía WebSocket.
 *
 * Crea una conexión Socket.io dedicada (independiente del chat) y emite
 * 'user:identify' para que el backend registre el socket en ChatSessionManager
 * sin necesidad de unirse a ningún grupo. El backend puede entonces alcanzar
 * este socket desde InAppWebSocketStrategy cuando emite 'notification:new'.
 */
export const useRealtimeNotifications = () => {
  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.user) return;

    const userId = authStore.user.id_user;

    const socket = io(getWsUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const identify = () => {
      socket.emit('user:identify', { id_user: userId });
    };

    socket.on('connect', identify);

    socket.on('notification:new', () => {
      notificationObserver.notify();
    });

    // If already connected on mount, identify immediately
    if (socket.connected) {
      identify();
    }

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
