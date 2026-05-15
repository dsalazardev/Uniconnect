import React from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { StudySessionInstance } from '@uniconnect/shared';
import styles from './StudySessions.module.css';

interface SessionListProps {
  sessions: StudySessionInstance[];
  isOwner: boolean;
  onCancel: (instanceId: number) => Promise<void>;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SessionList: React.FC<SessionListProps> = ({ sessions, isOwner, onCancel }) => {
  const [confirmId, setConfirmId] = React.useState<number | null>(null);
  const [cancelling, setCancelling] = React.useState(false);

  const handleConfirmCancel = async () => {
    if (confirmId === null) return;
    setCancelling(true);
    try {
      await onCancel(confirmId);
    } finally {
      setCancelling(false);
      setConfirmId(null);
    }
  };

  if (sessions.length === 0) {
    return <p className={styles.emptyText}>No hay sesiones programadas</p>;
  }

  return (
    <>
      {sessions.map((s) => (
        <div key={s.id_instance} className={styles.sessionRow}>
          <CalendarDays size={18} color="#D9B97E" style={{ marginTop: 2, flexShrink: 0 }} />
          <div className={styles.sessionInfo}>
            <p className={styles.sessionTitle}>{s.title}</p>
            <p className={styles.sessionMeta}>
              {formatDateTime(s.scheduled_date)} · {s.duration_minutes} min
            </p>
            {s.is_recurring && (
              <div className={styles.badgeRow}>
                <RefreshCw size={10} color="#D9B97E" />
                <span className={styles.badgeRecurring}>Recurrente</span>
              </div>
            )}
          </div>
          {isOwner && (
            <button
              className={styles.cancelBtn}
              onClick={() => setConfirmId(s.id_instance)}
            >
              Cancelar
            </button>
          )}
        </div>
      ))}

      <ConfirmModal
        visible={confirmId !== null}
        title="Cancelar sesión"
        message="¿Seguro que quieres cancelar esta sesión? Solo se eliminará esta instancia, las demás de la serie permanecen."
        confirmLabel="Sí, cancelar"
        cancelLabel="No"
        variant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmId(null)}
        loading={cancelling}
      />
    </>
  );
};
