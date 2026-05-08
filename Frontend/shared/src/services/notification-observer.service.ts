/**
 * NotificationObserverService - Shared observer for real-time notification updates
 *
 * Implements the Observer pattern to notify subscribers of notification changes
 * without polling. Platform-agnostic — no HTTP, no React, no Native imports.
 *
 * Usage:
 *   notificationObserver.subscribe(() => loadNotifications());
 *   notificationObserver.notify();
 */

type NotificationListener = () => void;

export class NotificationObserverService {
  private listeners: Set<NotificationListener> = new Set();

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error en notification listener:', error);
      }
    });
  }

  getListenerCount(): number {
    return this.listeners.size;
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const notificationObserver = new NotificationObserverService();
