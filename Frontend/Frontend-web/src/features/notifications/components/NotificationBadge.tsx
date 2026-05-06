import React from 'react';
import { observer } from 'mobx-react-lite';
import { notificationsStore } from '../store/notifications.store';
import styles from './NotificationBadge.module.css';

interface NotificationBadgeProps {
  onPress: () => void;
  color?: string;
  size?: number;
}

export const NotificationBadge = observer(function NotificationBadge({
  onPress,
  color = '#fff',
  size = 28,
}: NotificationBadgeProps) {
  const unreadCount = notificationsStore.unreadCount;

  return (
    <button
      className={styles.container}
      onClick={onPress}
      aria-label="Notificaciones"
    >
      <span
        className={styles.icon}
        style={{ color, fontSize: `${size}px` }}
      >
        🔔
      </span>

      {unreadCount > 0 && (
        <div className={styles.badge}>
          <span className={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </button>
  );
});
