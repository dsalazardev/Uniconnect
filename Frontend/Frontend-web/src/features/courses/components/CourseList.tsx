import React from 'react';
import { useStudentCourses } from '../hooks/useStudentCourses';
import styles from './CourseList.module.css';

export const CourseList: React.FC = () => {
  const { courses, loading, error } = useStudentCourses();

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Cargando cursos...</p>
      </div>
    );
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
        <div className={styles.emptyIcon}>📚</div>
        <p className={styles.emptyText}>No tienes cursos registrados</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mis Cursos</h1>
        <span className={styles.count}>{courses.length}</span>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.columnName}>Nombre</div>
          <div className={styles.columnCode}>Código</div>
          <div className={styles.columnProgram}>Programa</div>
          <div className={styles.columnState}>Estado</div>
        </div>

        <div className={styles.tableBody}>
          {courses.map((course) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};
