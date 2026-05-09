import React, { useState } from 'react';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { LoadingSpinner } from '@/components/elements';
import { AddCourseModal } from './AddCourseModal';
import { BookOpen, Plus } from 'lucide-react';
import styles from './CourseList.module.css';

export const CourseList: React.FC = () => {
  const { courses, loading, error, availableCourses, loadAvailableCourses, addCourse, isAddingCourse } = useStudentCourses();
  const [showAddModal, setShowAddModal] = useState(false);

  if (loading) {
    return <LoadingSpinner size="lg" label="Cargando cursos..." />;
  }

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>Error al cargar cursos</p>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className={styles.center}>
        <BookOpen size={48} className={styles.emptyIcon} />
        <p className={styles.emptyText}>No tienes cursos registrados</p>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    loadAvailableCourses();
    setShowAddModal(true);
  };

  const handleAddCourse = (courseId: string) => {
    addCourse({ id_course: courseId, status: 'active' });
    setShowAddModal(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className={styles.title}>Mis Cursos</h1>
          <span className={styles.count}>{courses?.length || 0}</span>
        </div>
        <button className={styles.addButton} onClick={handleOpenAddModal}>
          <Plus size={18} />
          Agregar Curso
        </button>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.columnName}>Nombre</div>
          <div className={styles.columnCode}>Código</div>
          <div className={styles.columnProgram}>Programa</div>
          <div className={styles.columnState}>Estado</div>
        </div>

        <div className={styles.tableBody}>
          {courses && courses.length > 0 ? (
            courses.map((course: any) => (
              <div key={course.id_course} className={styles.row}>
                <div className={styles.columnName}>{course.name}</div>
                <div className={styles.columnCode}>{course.code || '-'}</div>
                <div className={styles.columnProgram}>
                  {course.program?.name || '-'}
                </div>
                <div className={styles.columnState}>
                  <span className={styles.stateBadge}>{course.state || 'Activo'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyRow}>
              <p className={styles.emptyText}>No tienes cursos registrados</p>
            </div>
          )}
        </div>
      </div>

      <AddCourseModal
        visible={showAddModal}
        courses={availableCourses as any}
        loading={isAddingCourse}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCourse}
      />
    </div>
  );
};
