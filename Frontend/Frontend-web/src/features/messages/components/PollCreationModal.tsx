import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { CreatePollDto } from '@uniconnect/shared';
import styles from './PollCreationModal.module.css';

interface PollCreationModalProps {
  onClose: () => void;
  onSubmit: (dto: CreatePollDto) => Promise<void>;
}

export const PollCreationModal: React.FC<PollCreationModalProps> = ({ onClose, onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [closesAt, setClosesAt] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError('Ingresa al menos 2 opciones.');
      return;
    }
    if (!question.trim()) {
      setError('La pregunta no puede estar vacía.');
      return;
    }
    if (!closesAt) {
      setError('Debes indicar cuándo cierra la encuesta.');
      return;
    }
    if (new Date(closesAt) <= new Date()) {
      setError('La fecha de cierre debe ser en el futuro.');
      return;
    }

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

  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

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
          <label className={styles.label}>
            Pregunta
            <input
              className={styles.input}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="¿Cuál es tu pregunta?"
              maxLength={200}
              required
            />
          </label>

          <div className={styles.optionsSection}>
            <span className={styles.label}>Opciones</span>
            {options.map((opt, i) => (
              <div key={i} className={styles.optionRow}>
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
                    aria-label={`Eliminar opción ${i + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <button type="button" className={styles.addOptionBtn} onClick={addOption}>
                <Plus size={14} /> Agregar opción
              </button>
            )}
          </div>

          <label className={styles.label}>
            Cierra el
            <input
              className={styles.input}
              type="datetime-local"
              value={closesAt}
              min={minDateTime}
              onChange={(e) => setClosesAt(e.target.value)}
              required
            />
          </label>

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
