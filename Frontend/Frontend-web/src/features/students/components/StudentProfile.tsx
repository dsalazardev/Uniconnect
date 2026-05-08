import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { ArrowLeft, Smartphone } from 'lucide-react';
import styles from './StudentProfile.module.css';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, loading, error } = useStudentProfile(Number(id));

  const getImageUri = (picture?: string): string => {
    if (!picture) return 'https://via.placeholder.com/120';
    if (picture.startsWith('http')) return picture;
    return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${picture}`;
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Cargando perfil...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>{error || 'Perfil no encontrado'}</p>
        <button className={styles.backButton} onClick={() => navigate('/students')}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate('/students')}>
        <ArrowLeft size={20} /> Volver
      </button>

      <div className={styles.header}>
        <img
          src={getImageUri(profile.picture)}
          alt={profile.full_name}
          className={styles.avatar}
        />
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{profile.full_name}</h1>
          <p className={styles.email}>{profile.email}</p>
          {profile.phone && <p className={styles.phone}><Smartphone size={16} /> {profile.phone}</p>}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Información Académica</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Programa:</span>
            <span className={styles.infoValue}>{profile.program || 'No asignado'}</span>
          </div>
          {profile.current_semester && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Semestre:</span>
              <span className={styles.infoValue}>{profile.current_semester}</span>
            </div>
          )}
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Rol:</span>
            <span className={styles.infoValue}>{profile.roleName}</span>
          </div>
        </div>
      </div>

      {profile.common_courses && profile.common_courses.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Materias en Común</h2>
          <div className={styles.courseGrid}>
            {profile.common_courses.map((course) => (
              <div key={course.id_course} className={styles.courseBadge}>
                {course.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.courses && profile.courses.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Todas las Materias</h2>
          <div className={styles.courseList}>
            {profile.courses.map((course) => (
              <div key={course.id_course} className={styles.courseItem}>
                <span className={styles.courseName}>{course.name}</span>
                {course.state && (
                  <span className={styles.courseState}>{course.state}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
