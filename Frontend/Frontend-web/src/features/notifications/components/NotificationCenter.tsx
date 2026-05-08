import React from 'react';
import { observer } from 'mobx-react-lite';
import { NotificationItem } from './NotificationItem';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { notificationsStore } from '../store/notifications.store';
import { Bell, CheckCheck } from 'lucide-react';
import styles from './NotificationCenter.module.css';

export const NotificationCenter = observer(function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAllAsRead,
    handleNotificationPress,
    reloadNotifications,
  } = useUserNotifications();

  // Sincronizar el conteo global con la store
  React.useEffect(() => {
    notificationsStore.setUnreadCount(unreadCount);
  }, [unreadCount]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Cargando notificaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryButton} onClick={reloadNotifications}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className={styles.center}>
        <Bell size={48} className={styles.emptyIcon} />
        <p className={styles.emptyText}>No tienes notificaciones</p>
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className={styles.container}>
      {/* Header con botón "Marcar todas como leídas" */}
      {hasUnread && (
        <div className={styles.header}>
          <button className={styles.markAllButton} onClick={handleMarkAllAsRead}>
            <CheckCheck size={20} className={styles.markAllIcon} />
            <span>Marcar todas como leídas</span>
          </button>
        </div>
      )}

      <ul className={styles.list}>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id_notification}
            notification={notification}
            onPress={() => handleNotificationPress(notification)}
          />
        ))}
      </ul>
    </div>
  );
});
