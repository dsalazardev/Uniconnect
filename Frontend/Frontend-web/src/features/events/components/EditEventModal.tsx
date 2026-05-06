import React, { useState, useEffect } from 'react';
import type { Event, UpdateEventPayload } from '@uniconnect/shared';
import { EventType } from '@uniconnect/shared';
import styles from './EditEventModal.module.css';

interface EditEventModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
  onSave: (id: number, payload: UpdateEventPayload) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * EditEventModal - Pure UI component for event editing
 * Follows MVC pattern: only handles UI and emits data via onSave prop
 * Does NOT call services directly - maintains complete decoupling
 * 
 * ⭐ Preloads event data when event prop changes
 */
export const EditEventModal: React.FC<EditEventModalProps> = ({
  visible,
  event,
  onClose,
  onSave,
  isSubmitting = false,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<EventType>(EventType.CONFERENCIA);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Preload form fields with event data when event changes
   */
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setLocation(event.location);
      setType(event.type);
      setDate(event.date);
      setTime(event.time);
    }
  }, [event]);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!date) {
      newErrors.date = 'La fecha es obligatoria';
    }

    if (!time) {
      newErrors.time = 'La hora es obligatoria';
    }

    if (!location.trim()) {
      newErrors.location = 'La ubicación es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !event || !event.id_event) {
      console.error('❌ [EditEventModal] Invalid form or missing event ID:', { 
        hasEvent: !!event, 
        eventId: event?.id_event,
        formValid: validateForm() 
      });
      return;
    }

    // Emit data to parent via onSave prop
    const payload: UpdateEventPayload = {
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      location: location.trim(),
      type,
    };

    await onSave(event.id_event, payload);
  };

  /**
   * Reset form and close modal
   */
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.scrollView}>
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>Editar Evento</h2>
            <button onClick={handleClose} disabled={isSubmitting} className={styles.closeButton}>
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className={styles.form}>
            {/* Title */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Título *</label>
              <input
                type="text"
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                placeholder="Ej: Conferencia de Inteligencia Artificial"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.title && <span className={styles.errorText}>{errors.title}</span>}
            </div>

            {/* Description */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Descripción *</label>
              <textarea
                className={`${styles.input} ${styles.textArea} ${errors.description ? styles.inputError : ''}`}
                placeholder="Describe el evento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={isSubmitting}
              />
              {errors.description && <span className={styles.errorText}>{errors.description}</span>}
            </div>

            {/* Date */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Fecha *</label>
              <input
                type="date"
                className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.date && <span className={styles.errorText}>{errors.date}</span>}
            </div>

            {/* Time */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Hora *</label>
              <input
                type="time"
                className={`${styles.input} ${errors.time ? styles.inputError : ''}`}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.time && <span className={styles.errorText}>{errors.time}</span>}
            </div>

            {/* Location */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Ubicación *</label>
              <input
                type="text"
                className={`${styles.input} ${errors.location ? styles.inputError : ''}`}
                placeholder="Ej: Auditorio Principal"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.location && <span className={styles.errorText}>{errors.location}</span>}
            </div>

            {/* Type */}
            <div className={styles.fieldContainer}>
              <label className={styles.label}>Tipo de Evento *</label>
              <div className={styles.typeContainer}>
                {Object.values(EventType).map((eventType) => (
                  <button
                    key={eventType}
                    type="button"
                    className={`${styles.typeButton} ${type === eventType ? styles.typeButtonActive : ''}`}
                    onClick={() => setType(eventType)}
                    disabled={isSubmitting}
                  >
                    {eventType}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
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
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
