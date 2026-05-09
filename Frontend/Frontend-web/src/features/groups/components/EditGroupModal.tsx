import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/elements';
import { LoadingSpinner } from '@/components/elements';
import type { Group } from '@uniconnect/shared';
import type { Course } from '@uniconnect/shared';
import { useQuery } from '@tanstack/react-query';
import { coursesService } from '@/features/courses/services';
import styles from './EditGroupModal.module.css';

interface EditGroupModalProps {
  visible: boolean;
  group: Group | null;
  onClose: () => void;
  onSave: (groupId: number, groupData: {
    name: string;
    description: string;
    id_course: number;
  }) => void;
  isLoading?: boolean;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  visible,
  group,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: courses, isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ['owner-active-courses'],
    queryFn: () => coursesService.getOwnActiveCourses(),
    enabled: visible,
  });

  useEffect(() => {
    if (group && visible) {
      setName(group.name || '');
      setDescription(group.description || '');
      setSelectedCourseId(group.id_course || null);
      setError(null);
    }
  }, [group, visible]);

  const handleSave = () => {
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
    if (!group) {
      setError('No se pudo identificar el grupo');
      return;
    }

    setError(null);
    onSave(group.id_group, {
      name: name.trim(),
      description: description.trim(),
      id_course: selectedCourseId,
    });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedCourseId(null);
    setShowCourseDropdown(false);
    setError(null);
    onClose();
  };

  const selectedCourse = courses?.find((c) => c.id_course === selectedCourseId);

  return (
    <Modal visible={visible} onClose={handleClose} title="Editar Grupo">
      <div className={styles.container}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.inputGroup}>
          <label className={styles.label}>Nombre del grupo *</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Grupo de Cálculo"
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Curso *</label>
          {loadingCourses ? (
            <LoadingSpinner size="sm" label="Cargando cursos..." />
          ) : (
            <>
              <button
                type="button"
                className={styles.dropdown}
                onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                disabled={isLoading}
              >
                <span className={selectedCourse ? styles.dropdownText : styles.placeholder}>
                  {selectedCourse?.name || 'Selecciona un curso'}
                </span>
                <span>{showCourseDropdown ? '▲' : '▼'}</span>
              </button>

              {showCourseDropdown && (
                <div className={styles.dropdownList}>
                  {courses && courses.length > 0 ? (
                    courses.map((course) => (
                      <button
                        key={course.id_course}
                        type="button"
                        className={`${styles.dropdownItem} ${
                          selectedCourseId === course.id_course ? styles.dropdownItemSelected : ''
                        }`}
                        onClick={() => {
                          setSelectedCourseId(course.id_course);
                          setShowCourseDropdown(false);
                        }}
                      >
                        <span>{course.name}</span>
                        {selectedCourseId === course.id_course && <span>✓</span>}
                      </button>
                    ))
                  ) : (
                    <p className={styles.emptyText}>No hay cursos disponibles</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>ℹ️</span>
          <p className={styles.infoText}>Los miembros del grupo se mantendrán al actualizar</p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
