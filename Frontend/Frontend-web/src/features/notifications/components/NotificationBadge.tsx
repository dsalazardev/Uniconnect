import React from 'react';
import { observer } from 'mobx-react-lite';
import { notificationsStore } from '../store/notifications.store';
import { Bell } from 'lucide-react';
import styles from './NotificationBadge.module.css';

interface NotificationBadgeProps {
  onPress: () => void;
  color?: string;
  size?: number;
  className?: string;
}

export const NotificationBadge = observer(function NotificationBadge({
  onPress,
  color = '#fff',
  size = 28,
  className = '',
}: NotificationBadgeProps) {
  const unreadCount = notificationsStore.unreadCount;

  return (
    <button
      className={`${styles.container} ${className}`.trim()}
      onClick={onPress}
      aria-label="Notificaciones"
    >
      <span
        className={styles.icon}
        style={{ color, fontSize: `${size}px` }}
      >
        <Bell size={20} />
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
