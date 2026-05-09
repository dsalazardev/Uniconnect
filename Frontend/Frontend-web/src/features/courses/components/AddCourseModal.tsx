import React, { useState } from 'react';
import { Modal } from '@/components/elements';
import { BookOpen, Plus } from 'lucide-react';
import styles from './AddCourseModal.module.css';

interface Course {
  id_course: number;
  name: string;
  code?: string;
}

interface AddCourseModalProps {
  visible: boolean;
  courses: Course[];
  loading: boolean;
  onClose: () => void;
  onAdd: (courseId: string) => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  visible,
  courses,
  loading,
  onClose,
  onAdd,
}) => {
  const [selectedId, setSelectedId] = useState('');

  const handleAdd = () => {
    if (selectedId) {
      onAdd(selectedId);
      setSelectedId('');
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Agregar Curso">
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Cargando cursos...</p>
          </div>
        ) : !courses || courses.length === 0 ? (
          <div className={styles.emptyContainer}>
            <BookOpen size={48} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No hay cursos disponibles</p>
          </div>
        ) : (
          <>
            <div className={styles.courseList}>
              {courses.map((course) => (
                <label
                  key={course.id_course}
                  className={`${styles.courseOption} ${
                    selectedId === String(course.id_course) ? styles.selected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="course"
                    value={course.id_course}
                    checked={selectedId === String(course.id_course)}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className={styles.radio}
                  />
                  <div className={styles.courseInfo}>
                    <span className={styles.courseName}>{course.name}</span>
                    {course.code && (
                      <span className={styles.courseCode}>{course.code}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className={styles.actions}>
              <button className={styles.cancelButton} onClick={onClose}>
                Cancelar
              </button>
              <button
                className={styles.addButton}
                onClick={handleAdd}
                disabled={!selectedId}
              >
                <Plus size={16} />
                Agregar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
