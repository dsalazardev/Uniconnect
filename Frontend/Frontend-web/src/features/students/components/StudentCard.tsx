import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Student, CommonCourse } from '@uniconnect/shared';
import styles from './StudentCard.module.css';

interface StudentCardProps {
  student: Student;
  isFriend?: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, isFriend = false }) => {
  const navigate = useNavigate();

  const commonCourses = React.useMemo<CommonCourse[]>(() => {
    const raw = student.common_courses ?? [];

    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.filter((course): course is CommonCourse => Boolean(course?.name));
  }, [student]);

  const handlePress = () => {
    navigate(`/students/${student.id_user}`);
  };

  const getImageUri = (picture?: string): string => {
    if (!picture) return 'https://via.placeholder.com/60';
    if (picture.startsWith('http')) return picture;
    return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${picture}`;
  };

  return (
    <div className={styles.card} onClick={handlePress}>
      <img
        src={getImageUri(student.picture)}
        alt={student.full_name}
        className={styles.avatar}
      />

      <div className={styles.infoContainer}>
        <h3 className={styles.name}>{student.full_name}</h3>

        <div className={styles.programRow}>
          <span className={styles.program}>
            {student.program?.name || 'Programa no asignado'}
          </span>
          {student.current_semester && (
            <span className={styles.semester}>• Semestre {student.current_semester}</span>
          )}
        </div>

        {commonCourses.length > 0 ? (
          <div className={styles.badgeContainer}>
            {commonCourses.map((course) => (
              <span key={`${course.id_course}-${course.name}`} className={styles.badge}>
                {course.name}
              </span>
            ))}
          </div>
        ) : (
          <span className={styles.noCourses}>Sin materias en común</span>
        )}
      </div>

      {isFriend && (
        <div className={styles.friendBadge}>
          <span className={styles.friendIcon}>✓</span>
        </div>
      )}
    </div>
  );
};
