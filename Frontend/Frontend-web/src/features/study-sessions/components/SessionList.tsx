import React from 'react';
import { CalendarDays, RefreshCw, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { StudySessionInstance } from '@uniconnect/shared';
import type { AttendanceStatus } from '../services/study-sessions.service';
import styles from './StudySessions.module.css';

interface SessionListProps {
  sessions: StudySessionInstance[];
  currentUserId: number;
  isOwner: boolean;
  onCancel: (instanceId: number) => Promise<void>;
  onUpdateAttendance: (instanceId: number, status: AttendanceStatus) => Promise<void>;
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

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  CONFIRMED: 'Confirmado',
  DECLINED: 'Declinado',
  PENDING: 'Pendiente',
};

const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  CONFIRMED: '#34D399',
  DECLINED: '#EF4444',
  PENDING: '#9CA3AF',
};

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const color = ATTENDANCE_COLORS[status];
  const label = ATTENDANCE_LABELS[status];
  const Icon = status === 'CONFIRMED' ? CheckCircle : status === 'DECLINED' ? XCircle : Clock;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color, fontWeight: 600 }}>
      <Icon size={13} color={color} />
      {label}
    </span>
  );
}

interface RSVPModalProps {
  session: StudySessionInstance;
  onClose: () => void;
  onSelect: (status: AttendanceStatus) => void;
  error: string | null;
}

function RSVPModal({ session, onClose, onSelect, error }: RSVPModalProps) {
  const OPTIONS: { status: AttendanceStatus; label: string; color: string }[] = [
    { status: 'CONFIRMED', label: '✓ Asistiré', color: '#34D399' },
    { status: 'DECLINED', label: '✗ No asistiré', color: '#EF4444' },
    { status: 'PENDING', label: '• Tal vez', color: '#9CA3AF' },
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e1e1e', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400,
          border: '1px solid rgba(217,185,126,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: 16, fontWeight: 700 }}>
          {session.title}
        </h3>
        <p style={{ margin: '0 0 16px', color: '#9CA3AF', fontSize: 13 }}>
          {formatDateTime(session.scheduled_date)} · {session.duration_minutes} min
        </p>

        {session.attendance_count > 0 && (
          <p style={{ margin: '0 0 16px', color: '#D9B97E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} />
            {session.attendance_count} {session.attendance_count === 1 ? 'persona confirmada' : 'personas confirmadas'}
          </p>
        )}

        <p style={{ margin: '0 0 12px', color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>¿Puedes asistir?</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {OPTIONS.map((opt) => {
            const isActive = session.my_attendance === opt.status;
            return (
              <button
                key={opt.status}
                onClick={() => onSelect(opt.status)}
                style={{
                  padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                  fontWeight: 600, border: `1px solid ${isActive ? opt.color : 'rgba(255,255,255,0.1)'}`,
                  background: isActive ? `${opt.color}18` : 'transparent',
                  color: isActive ? opt.color : '#9CA3AF',
                  transition: 'all 0.15s', textAlign: 'left',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {error && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{error}</p>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 16, width: '100%', padding: '8px', borderRadius: 8,
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            color: '#6B7280', cursor: 'pointer', fontSize: 13,
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentUserId,
  isOwner,
  onCancel,
  onUpdateAttendance,
}) => {
  const [confirmId, setConfirmId] = React.useState<number | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
  const [rsvpSession, setRsvpSession] = React.useState<StudySessionInstance | null>(null);
  const [rsvpError, setRsvpError] = React.useState<string | null>(null);

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

  const handleRsvpSelect = (status: AttendanceStatus) => {
    if (!rsvpSession) return;
    setRsvpError(null);
    // Actualizar el modal de inmediato (el hook ya hace el optimistic update en la lista)
    setRsvpSession((prev) => prev ? { ...prev, my_attendance: status } : null);
    onUpdateAttendance(rsvpSession.id_instance, status).catch(() => {
      setRsvpError('Error al guardar. Intenta de nuevo.');
      // El hook revertirá el estado de la lista; revertimos también el modal
      setRsvpSession((prev) => prev ? { ...prev, my_attendance: rsvpSession.my_attendance } : null);
    });
  };

  if (sessions.length === 0) {
    return <p className={styles.emptyText}>No hay sesiones programadas</p>;
  }

  return (
    <>
      {sessions.map((s) => {
        const isCreator = s.created_by === currentUserId;
        return (
          <div
            key={s.id_instance}
            className={styles.sessionRow}
            style={{ cursor: isCreator ? 'default' : 'pointer' }}
            onClick={() => { if (!isCreator) setRsvpSession(s); }}
          >
            <CalendarDays size={18} color="#D9B97E" style={{ marginTop: 2, flexShrink: 0 }} />
            <div className={styles.sessionInfo}>
              <p className={styles.sessionTitle}>{s.title}</p>
              <p className={styles.sessionMeta}>
                {formatDateTime(s.scheduled_date)} · {s.duration_minutes} min
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                {s.is_recurring && (
                  <div className={styles.badgeRow}>
                    <RefreshCw size={10} color="#D9B97E" />
                    <span className={styles.badgeRecurring}>Recurrente</span>
                  </div>
                )}
                {s.attendance_count > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9CA3AF' }}>
                    <Users size={12} />
                    {s.attendance_count} confirmado{s.attendance_count !== 1 ? 's' : ''}
                  </span>
                )}
                {!isCreator && s.my_attendance && (
                  <AttendanceBadge status={s.my_attendance} />
                )}
                {isCreator && (
                  <span style={{ fontSize: 12, color: '#D9B97E', fontWeight: 600 }}>Organizador</span>
                )}
              </div>
            </div>
            {isCreator && (isOwner || s.created_by === currentUserId) && (
              <button
                className={styles.cancelBtn}
                onClick={(e) => { e.stopPropagation(); setConfirmId(s.id_instance); }}
              >
                Cancelar
              </button>
            )}
          </div>
        );
      })}

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

      {rsvpSession && (
        <RSVPModal
          session={rsvpSession}
          onClose={() => { setRsvpSession(null); setRsvpError(null); }}
          onSelect={handleRsvpSelect}
          error={rsvpError}
        />
      )}
    </>
  );
};
