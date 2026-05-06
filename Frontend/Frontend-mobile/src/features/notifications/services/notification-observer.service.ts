type NotificationListener = () => void;

/**
 * Servicio Observer para notificaciones en tiempo real
 * Patrón Observer para notificar cambios sin polling
 * 
 * Uso:
 * 1. Los componentes se suscriben con subscribe()
 * 2. Cuando hay cambios (nueva notificación, marcar como leída, etc), llamar notify()
 * 3. Todos los listeners suscritos se ejecutan automáticamente
 */
class NotificationObserverService {
  private listeners: Set<NotificationListener> = new Set();

  /**
   * Suscribirse a cambios en notificaciones
   * @returns Función de cleanup para desuscribirse
   * 
   * Ejemplo:
   * ```typescript
   * useEffect(() => {
   *   const unsubscribe = notificationObserver.subscribe(() => {
   *     loadNotifications();
   *   });
   *   return unsubscribe;
   * }, []);
   * ```
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    
    // Retornar función de cleanup
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notificar a todos los listeners que hay nuevas notificaciones o cambios
   * 
   * Llamar este método cuando:
   * - Se recibe una push notification
   * - Se detecta una nueva notificación vía WebSocket
   * - Se marca una notificación como leída
   * - Se marcan todas como leídas
   * - Cualquier cambio que afecte el estado de notificaciones
   * 
   * Ejemplo:
   * ```typescript
   * // Después de marcar como leída
   * await notificationsService.markAsRead(id, token);
   * notificationObserver.notify(); // Ya se hace automáticamente en el servicio
   * ```
   */
  notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error en notification listener:', error);
      }
    });
  }

  /**
   * Obtener número de listeners activos (para debugging)
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Limpiar todos los listeners (útil para testing)
   */
  clear(): void {
    this.listeners.clear();
  }
}

export const notificationObserver = new NotificationObserverService();
