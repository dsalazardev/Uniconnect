import React, { useState } from 'react';
import { StudentCard } from './StudentCard';
import { useCommunityLists } from '../hooks/useCommunityLists';
import styles from './StudentList.module.css';

export const StudentList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'community'>('friends');

  const {
    connectedStudents,
    notConnectedStudents,
    connectedQuery,
    notConnectedQuery,
  } = useCommunityLists(search);

  const isLoading = connectedQuery.isLoading || notConnectedQuery.isLoading;
  const error = connectedQuery.error || notConnectedQuery.error;

  const displayedStudents = activeTab === 'friends' ? connectedStudents : notConnectedStudents;

  if (isLoading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Cargando estudiantes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>Error al cargar estudiantes</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar por nombre, programa o materia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'friends' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Mis Amigos ({connectedStudents.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'community' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('community')}
          >
            Comunidad ({notConnectedStudents.length})
          </button>
        </div>
      </div>

      {displayedStudents.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            {search
              ? 'No se encontraron estudiantes'
              : activeTab === 'friends'
              ? 'Aún no tienes amigos conectados'
              : 'No hay estudiantes disponibles'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayedStudents.map((student) => (
            <StudentCard
              key={student.id_user}
              student={student}
              isFriend={activeTab === 'friends'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
