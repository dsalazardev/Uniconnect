import React from 'react';
import { observer } from 'mobx-react-lite';
import { NotificationItem } from './NotificationItem';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { notificationsStore } from '../store/notifications.store';
import { LoadingSpinner } from '@/components/elements';
import { Bell, CheckCheck, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { NotificationType } from '@uniconnect/shared';
import styles from './NotificationCenter.module.css';

type ReadFilter = 'all' | 'read' | 'unread';

const TYPE_LABELS: Record<NotificationType, string> = {
  connection_request: 'Conexión',
  message: 'Mensaje',
  group_invitation: 'Invitación a grupo',
  group_invitation_accepted: 'Invitación aceptada',
  user_joined_group: 'Nuevo miembro',
  group_join_request: 'Solicitud de ingreso',
  group_join_request_accepted: 'Solicitud aceptada',
  group_join_request_rejected: 'Solicitud rechazada',
  member_accepted: 'Miembro aceptado',
  member_removed: 'Miembro eliminado',
  join_request: 'Solicitud de ingreso',
  mention: 'Mención',
  admin_transfer_requested: 'Transferencia de admin',
  admin_transfer_accepted: 'Transferencia aceptada',
  admin_transfer_declined: 'Transferencia rechazada',
};

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

  const [activeTypeFilter, setActiveTypeFilter] = React.useState<NotificationType | null>(null);
  const [activeReadFilter, setActiveReadFilter] = React.useState<ReadFilter>('all');

  React.useEffect(() => {
    notificationsStore.setUnreadCount(unreadCount);
  }, [unreadCount]);

  // CA5: auto-marcar como leídas 2s después de abrir el panel.
  // Deps vacíos son intencionales: mount = panel abierto, unmount = panel cerrado (cleanup cancela el timer).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const hasUnread = notifications.some((n) => !n.is_read);
    if (!hasUnread) return;
    const timer = setTimeout(markAllAsRead, 2000);
    return () => clearTimeout(timer);
  }, []);

  const availableTypes = React.useMemo(
    () => [...new Set(notifications.map((n) => n.notification_type))],
    [notifications],
  );

  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((n) => {
      if (activeTypeFilter && n.notification_type !== activeTypeFilter) return false;
      if (activeReadFilter === 'read' && !n.is_read) return false;
      if (activeReadFilter === 'unread' && n.is_read) return false;
      return true;
    });
  }, [notifications, activeTypeFilter, activeReadFilter]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Cargando notificaciones..." />;
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
      <div className={styles.header}>
        <Link className={styles.preferencesLink} to="/notifications/preferences">
          <SlidersHorizontal size={18} />
          Preferencias
        </Link>

        {/* Filtros */}
        <div className={styles.filterRow}>
          <select
            className={styles.filterSelect}
            value={activeTypeFilter ?? ''}
            onChange={(e) =>
              setActiveTypeFilter((e.target.value as NotificationType) || null)
            }
          >
            <option value="">Todos los tipos</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type] ?? type}
              </option>
            ))}
          </select>

          <div className={styles.readFilterGroup}>
            {(['all', 'unread', 'read'] as ReadFilter[]).map((f) => (
              <button
                key={f}
                className={`${styles.readFilterButton} ${activeReadFilter === f ? styles.readFilterButtonActive : ''}`}
                onClick={() => setActiveReadFilter(f)}
              >
                {f === 'all' ? 'Todas' : f === 'unread' ? 'No leídas' : 'Leídas'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterMeta}>
          <span className={styles.resultCount}>
            {filteredNotifications.length} de {notifications.length}
          </span>
          {hasUnread && (
            <button className={styles.markAllButton} onClick={handleMarkAllAsRead}>
              <CheckCheck size={20} className={styles.markAllIcon} />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className={styles.center}>
          <Bell size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>Sin resultados para los filtros seleccionados</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id_notification}
              notification={notification}
              onPress={() => handleNotificationPress(notification)}
            />
          ))}
        </ul>
      )}
    </div>
  );
});
