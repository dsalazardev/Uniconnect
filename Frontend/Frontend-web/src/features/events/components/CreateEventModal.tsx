import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './CreateEventModal.module.css';

interface EventCategory {
  id_category: number;
  name: string;
  color: string;
}

export interface CreateEventFormPayload {
  id_category: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
}

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventFormPayload) => void;
  isSubmitting?: boolean;
  categories?: EventCategory[];
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
  categories = [],
}) => {
  const [form, setForm] = useState<{
    id_category: number | '';
    title: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
  }>({
    id_category: '',
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form, value: string | number) =>
    setForm((p) => ({ ...p, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.id_category) e.id_category = 'Selecciona una categoría';
    if (!form.title.trim()) e.title = 'El título es obligatorio';
    if (!form.description.trim()) e.description = 'La descripción es obligatoria';
    if (!form.location.trim()) e.location = 'La ubicación es obligatoria';
    if (!form.start_date) e.start_date = 'La fecha de inicio es obligatoria';
    if (!form.end_date) e.end_date = 'La fecha de fin es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || form.id_category === '') return;
    onSubmit({
      id_category: form.id_category as number,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
    });
  };

  const handleClose = () => {
    setForm({ id_category: '', title: '', description: '', location: '', start_date: '', end_date: '' });
    setErrors({});
    onClose();
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.scrollView}>
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>Crear Nuevo Evento</h2>
            <button onClick={handleClose} disabled={isSubmitting} className={styles.closeButton}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Categoría */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Categoría *</label>
              <select
                className={`${styles.input} ${errors.id_category ? styles.inputError : ''}`}
                value={form.id_category}
                onChange={(e) => set('id_category', e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((c) => (
                  <option key={c.id_category} value={c.id_category}>{c.name}</option>
                ))}
              </select>
              {errors.id_category && <span className={styles.errorText}>{errors.id_category}</span>}
            </div>

            {/* Título */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Título *</label>
              <input
                type="text" maxLength={300}
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                placeholder="Ej: Conferencia de Inteligencia Artificial"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                disabled={isSubmitting}
              />
              {errors.title && <span className={styles.errorText}>{errors.title}</span>}
            </div>

            {/* Descripción */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Descripción *</label>
              <textarea
                className={`${styles.input} ${styles.textArea} ${errors.description ? styles.inputError : ''}`}
                placeholder="Describe el evento..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                maxLength={2000}
                disabled={isSubmitting}
              />
              {errors.description && <span className={styles.errorText}>{errors.description}</span>}
            </div>

            {/* Ubicación */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Ubicación *</label>
              <input
                type="text" maxLength={300}
                className={`${styles.input} ${errors.location ? styles.inputError : ''}`}
                placeholder="Ej: Auditorio Principal"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                disabled={isSubmitting}
              />
              {errors.location && <span className={styles.errorText}>{errors.location}</span>}
            </div>

            {/* Fecha inicio */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Fecha y hora de inicio *</label>
              <input
                type="datetime-local"
                className={`${styles.input} ${errors.start_date ? styles.inputError : ''}`}
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                disabled={isSubmitting}
                style={{ colorScheme: 'dark' }}
              />
              {errors.start_date && <span className={styles.errorText}>{errors.start_date}</span>}
            </div>

            {/* Fecha fin */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Fecha y hora de fin *</label>
              <input
                type="datetime-local"
                className={`${styles.input} ${errors.end_date ? styles.inputError : ''}`}
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                disabled={isSubmitting}
                style={{ colorScheme: 'dark' }}
              />
              {errors.end_date && <span className={styles.errorText}>{errors.end_date}</span>}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.button} ${styles.cancelButton}`}
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`${styles.button} ${styles.submitButton} ${isSubmitting ? styles.submitButtonDisabled : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando...' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
