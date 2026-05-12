import React, { useState } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import type { CreatePollDto } from '@uniconnect/shared';
import styles from './PollCreationModal.module.css';

interface PollCreationModalProps {
  onClose: () => void;
  onSubmit: (dto: CreatePollDto) => Promise<void>;
}

const DURATION_PRESETS = [
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hora', ms: 60 * 60 * 1000 },
  { label: '3 horas', ms: 3 * 60 * 60 * 1000 },
  { label: '1 día', ms: 24 * 60 * 60 * 1000 },
  { label: 'Personalizado', ms: -1 },
];

function toLocalDateTimeInputs(date: Date): { date: string; time: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function todayMin(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const PollCreationModal: React.FC<PollCreationModalProps> = ({ onClose, onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handlePreset = (idx: number) => {
    setSelectedPreset(idx);
    const preset = DURATION_PRESETS[idx];
    if (preset.ms > 0) {
      const target = new Date(Date.now() + preset.ms);
      const { date, time } = toLocalDateTimeInputs(target);
      setCustomDate(date);
      setCustomTime(time);
    }
  };

  const getClosesAt = (): string | null => {
    if (!customDate || !customTime) return null;
    return new Date(`${customDate}T${customTime}:00`).toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) { setError('La pregunta no puede estar vacía.'); return; }
    if (validOptions.length < 2) { setError('Ingresa al menos 2 opciones.'); return; }

    const closesAt = getClosesAt();
    if (!closesAt) { setError('Selecciona cuándo cierra la encuesta.'); return; }
    if (new Date(closesAt) <= new Date()) { setError('La fecha de cierre debe ser en el futuro.'); return; }

    setSubmitting(true);
    try {
      await onSubmit({ question: question.trim(), options: validOptions, closesAt });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al crear la encuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  const isCustom = selectedPreset === DURATION_PRESETS.length - 1;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Nueva encuesta</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Pregunta */}
          <div className={styles.field}>
            <label className={styles.label}>Pregunta</label>
            <input
              className={styles.input}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="¿Cuál es tu pregunta?"
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Opciones */}
          <div className={styles.field}>
            <label className={styles.label}>Opciones</label>
            <div className={styles.optionsList}>
              {options.map((opt, i) => (
                <div key={i} className={styles.optionRow}>
                  <span className={styles.optionNum}>{i + 1}</span>
                  <input
                    className={styles.input}
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Opción ${i + 1}`}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeOption(i)}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 5 && (
              <button type="button" className={styles.addOptionBtn} onClick={addOption}>
                <Plus size={13} /> Agregar opción
              </button>
            )}
          </div>

          {/* Duración */}
          <div className={styles.field}>
            <label className={styles.label}>
              <Clock size={13} style={{ display: 'inline', marginRight: 5 }} />
              Duración
            </label>
            <div className={styles.presets}>
              {DURATION_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className={`${styles.preset} ${selectedPreset === i ? styles.presetActive : ''}`}
                  onClick={() => handlePreset(i)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {selectedPreset !== null && (
              <div className={styles.dateRow}>
                <div className={styles.dateField}>
                  <label className={styles.subLabel}>Fecha</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={customDate}
                    min={todayMin()}
                    onChange={(e) => { setCustomDate(e.target.value); setSelectedPreset(DURATION_PRESETS.length - 1); }}
                    readOnly={!isCustom}
                  />
                </div>
                <div className={styles.dateField}>
                  <label className={styles.subLabel}>Hora</label>
                  <input
                    className={styles.input}
                    type="time"
                    value={customTime}
                    onChange={(e) => { setCustomTime(e.target.value); setSelectedPreset(DURATION_PRESETS.length - 1); }}
                    readOnly={!isCustom}
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear encuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
