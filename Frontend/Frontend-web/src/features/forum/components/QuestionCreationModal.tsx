import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CreateQuestionDto } from '@uniconnect/shared';
import styles from './QuestionCreationModal.module.css';

interface QuestionCreationModalProps {
  onClose: () => void;
  onSubmit: (dto: CreateQuestionDto) => Promise<void>;
}

export const QuestionCreationModal: React.FC<QuestionCreationModalProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('El título no puede estar vacío.'); return; }
    if (!body.trim())  { setError('El cuerpo no puede estar vacío.'); return; }

    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), body: body.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al crear la pregunta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Nueva pregunta</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.field}>
            <label className={styles.label}>Título</label>
            <input
              className={styles.input}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Cuál es tu pregunta?"
              maxLength={300}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Explica tu pregunta con más detalle..."
              maxLength={2000}
              rows={5}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Publicando...' : 'Publicar pregunta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
