import React from 'react';
import { usePrograms } from '../hooks/usePrograms';
import { GraduationCap } from 'lucide-react';
import styles from './ProgramList.module.css';

export const ProgramList: React.FC = () => {
  const { programs, loading, error } = usePrograms();

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Cargando programas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>Error al cargar programas</p>
      </div>
    );
  }

  if (!programs || programs.length === 0) {
    return (
      <div className={styles.center}>
        <GraduationCap size={48} className={styles.emptyIcon} />
        <p className={styles.emptyText}>No hay programas disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Programas Académicos</h1>
        <span className={styles.count}>{programs.length}</span>
      </div>

      <div className={styles.grid}>
        {programs.map((program) => (
          <div key={program.id_program} className={styles.card}>
            <GraduationCap size={20} className={styles.icon} />
            <h3 className={styles.programName}>{program.name}</h3>
            <span className={styles.programId}>ID: {program.id_program}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
