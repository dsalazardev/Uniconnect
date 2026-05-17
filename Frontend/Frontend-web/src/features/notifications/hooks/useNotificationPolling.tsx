import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { notificationsService } from '../services';
import { notificationsStore } from '../store/notifications.store';
import { authStore } from '@/features/auth/store/AuthStore';
import type { Notification } from '@uniconnect/shared';

const POLL_INTERVAL = 30000;

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  group_invitation: 'Invitación a grupo',
  group_invitation_accepted: 'Invitación aceptada',
  user_joined_group: 'Nuevo miembro',
  group_join_request: 'Solicitud unirse',
  group_join_request_accepted: 'Solicitud aceptada',
  group_join_request_rejected: 'Solicitud rechazada',
  connection_request: 'Solicitud de conexión',
  mention: 'Mención',
  member_accepted: 'Aceptado en grupo',
  admin_transfer_requested: 'Transferencia de admin',
};

export const useNotificationPolling = () => {
  const notificationsRef = useRef<Notification[]>([]);

  useEffect(() => {
    if (!authStore.isAuthenticated) return;

    const poll = async () => {
      try {
        const data = await notificationsService.getNotifications();
        const notifications = Array.isArray(data) ? data : [];

        const prevIds = new Set(notificationsRef.current.map((n) => n.id_notification));
        const newOnes = notifications.filter(
          (n) => !prevIds.has(n.id_notification) && !n.is_read,
        );

        for (const n of newOnes) {
          const label = NOTIFICATION_TYPE_LABELS[n.notification_type] || 'Notificación';
          toast.custom(
            (t) => (
              <div
                style={{
                  background: '#1a1a1a',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(217, 185, 126, 0.3)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  minWidth: 260,
                  maxWidth: 340,
                  opacity: t.visible ? 1 : 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#D9B97E', fontWeight: 600 }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 14 }}>{n.message}</span>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#888',
                    fontSize: 18,
                    lineHeight: 1,
                    padding: '0 2px',
                    flexShrink: 0,
                    marginTop: -2,
                  }}
                  aria-label="Cerrar notificación"
                >
                  ×
                </button>
              </div>
            ),
            { duration: 5000 },
          );
        }

        if (newOnes.length > 0) {
          notificationsStore.setUnreadCount(
            notifications.filter((n) => !n.is_read).length,
          );
        }

        const lastId = notifications.length > 0 ? notifications[0].id_notification : null;
        if (lastId !== null) {
          notificationsStore.setLastNotificationId(lastId);
        }

        notificationsRef.current = notifications;
      } catch {
        // Silencioso — no mostrar error en polling
      }
    };

    poll();

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [authStore.isAuthenticated]);
};
