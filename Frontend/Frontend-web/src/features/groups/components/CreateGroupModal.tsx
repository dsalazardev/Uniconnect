import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './CreateGroupModal.module.css';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (groupData: { name: string; description: string; id_course: number }) => Promise<void>;
  isCreating?: boolean;
  courses?: Array<{ id_course: number; name: string }>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onSave,
  isCreating = false,
  courses = [],
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('El nombre del grupo es obligatorio');
      return;
    }
    if (!description.trim()) {
      setError('La descripción del grupo es obligatoria');
      return;
    }
    if (!selectedCourseId) {
      setError('Debes seleccionar un curso');
      return;
    }

    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        id_course: selectedCourseId,
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo crear el grupo');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedCourseId(null);
    setError(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Crear Grupo de Estudio</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre del grupo *</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Grupo de Cálculo"
              disabled={isCreating}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Descripción *</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el propósito del grupo..."
              rows={4}
              disabled={isCreating}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Curso *</label>
            <select
              className={styles.input}
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              disabled={isCreating}
            >
              <option value="">Selecciona un curso</option>
              {courses.map((course) => (
                <option key={course.id_course} value={course.id_course}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submitButton}`}
              disabled={isCreating}
            >
              {isCreating ? 'Creando...' : 'Crear Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
