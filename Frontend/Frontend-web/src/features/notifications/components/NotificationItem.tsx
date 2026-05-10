import React from 'react';
import type { Notification } from '@uniconnect/shared';
import styles from './NotificationItem.module.css';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'connection_request':
        return { emoji: '👤', color: '#D9B97E' };
      case 'message':
        return { emoji: '💬', color: '#10B981' };
      case 'group_invitation':
        return { emoji: '✉️', color: '#3B82F6' };
      case 'group_invitation_accepted':
        return { emoji: '✅', color: '#8B5CF6' };
      case 'user_joined_group':
        return { emoji: '👥', color: '#F59E0B' };
      case 'join_request':
        return { emoji: '🙋', color: '#F97316' };
      case 'member_accepted':
        return { emoji: '✅', color: '#22C55E' };
      case 'member_removed':
        return { emoji: '❌', color: '#EF4444' };
      case 'mention':
        return { emoji: '@', color: '#38BDF8' };
      case 'admin_transfer_requested':
        return { emoji: '🛡️', color: '#A855F7' };
      case 'admin_transfer_accepted':
        return { emoji: '🛡✅', color: '#22C55E' };
      case 'admin_transfer_declined':
        return { emoji: '🛡❌', color: '#EF4444' };
      default:
        return { emoji: '🔔', color: '#D9B97E' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  };

  const icon = getIcon();

  return (
    <li
      className={`${styles.container} ${!notification.is_read ? styles.unread : ''}`}
      onClick={onPress}
    >
      <div
        className={styles.iconContainer}
        style={{ backgroundColor: `${icon.color}20` }}
      >
        <span className={styles.icon}>{icon.emoji}</span>
      </div>

      <div className={styles.content}>
        <p className={styles.message}>{notification.message}</p>
        <span className={styles.date}>{formatDate(notification.created_at)}</span>
      </div>

      {!notification.is_read && <div className={styles.unreadBadge} />}
    </li>
  );
};
