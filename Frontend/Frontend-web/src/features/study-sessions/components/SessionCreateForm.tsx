import React from 'react';
import type { CreateStudySessionDto } from '@uniconnect/shared';
import styles from './StudySessions.module.css';

interface SessionCreateFormProps {
  onSubmit: (dto: CreateStudySessionDto) => Promise<void>;
  onCancel: () => void;
}

export const SessionCreateForm: React.FC<SessionCreateFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startDatetime, setStartDatetime] = React.useState('');
  const [durationMinutes, setDurationMinutes] = React.useState(60);
  const [recurrenceType, setRecurrenceType] = React.useState<'NONE' | 'WEEKLY'>('NONE');
  const [recurrenceEndDate, setRecurrenceEndDate] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('El título es requerido.'); return; }
    if (!startDatetime) { setError('La fecha y hora de inicio son requeridas.'); return; }
    if (recurrenceType === 'WEEKLY' && !recurrenceEndDate) {
      setError('La fecha de fin de recurrencia es requerida para sesiones semanales.'); return;
    }

    const dto: CreateStudySessionDto = {
      title: title.trim(),
      description: description.trim() || undefined,
      startDatetime: new Date(startDatetime).toISOString(),
      durationMinutes,
      recurrenceType,
      recurrenceEndDate:
        recurrenceType === 'WEEKLY' && recurrenceEndDate
          ? new Date(recurrenceEndDate).toISOString()
          : undefined,
    };

    setSubmitting(true);
    try {
      await onSubmit(dto);
    } catch (err: any) {
      // Axios wraps the response — extract the NestJS validation message
      const apiMessage = err?.response?.data?.message;
      const readable = Array.isArray(apiMessage)
        ? apiMessage.join(' · ')
        : (apiMessage ?? err.message ?? 'Error al crear la sesión.');
      setError(readable);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <label className={styles.label}>Título *</label>
        <input
          className={styles.input}
          type="text"
          placeholder="Ej: Repaso de Álgebra"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>Descripción</label>
        <input
          className={styles.input}
          type="text"
          placeholder="Opcional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>Fecha y hora de inicio *</label>
        <input
          className={styles.input}
          type="datetime-local"
          value={startDatetime}
          min={(() => {
            const d = new Date(Date.now() + 60 * 60 * 1000);
            const p = (n: number) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
          })()}
          onChange={(e) => setStartDatetime(e.target.value)}
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>Duración (minutos) *</label>
        <input
          className={styles.input}
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>Recurrencia</label>
        <select
          className={styles.select}
          value={recurrenceType}
          onChange={(e) => setRecurrenceType(e.target.value as 'NONE' | 'WEEKLY')}
        >
          <option value="NONE">Sin recurrencia</option>
          <option value="WEEKLY">Semanal</option>
        </select>
      </div>

      {recurrenceType === 'WEEKLY' && (
        <div className={styles.formRow}>
          <label className={styles.label}>Fecha de fin de recurrencia *</label>
          <input
            className={styles.input}
            type="date"
            value={recurrenceEndDate}
            onChange={(e) => setRecurrenceEndDate(e.target.value)}
          />
        </div>
      )}

      {error && (
        <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{error}</p>
      )}

      <div className={styles.formActions}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={submitting}>
          {submitting ? 'Guardando...' : 'Crear sesión'}
        </button>
      </div>
    </form>
  );
};
