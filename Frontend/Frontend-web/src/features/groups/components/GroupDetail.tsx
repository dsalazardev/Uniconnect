import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsService } from '../services';
import { MemberList } from './MemberList';
import styles from './GroupDetail.module.css';

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroupDetail = async () => {
      try {
        setLoading(true);
        const groupId = parseInt(id as string);
        const response = await groupsService.getGroupInfo(groupId);

        if (response.success && response.data) {
          setGroupInfo(response.data);
          setError(null);
        } else {
          setError(response.error?.message || 'Grupo no encontrado');
        }
      } catch (err: any) {
        console.error('Error loading group:', err);
        setError(err.message || 'Error al cargar el grupo');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadGroupDetail();
    }
  }, [id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            ← Volver
          </button>
          <h1 className={styles.headerTitle}>Cargando...</h1>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (error || !groupInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            ← Volver
          </button>
          <h1 className={styles.headerTitle}>Error</h1>
        </div>
        <div className={styles.errorContainer}>
          <span className={styles.errorIcon}>⚠️</span>
          <p className={styles.errorText}>{error || 'Grupo no encontrado'}</p>
          <button className={styles.retryButton} onClick={handleGoBack}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleGoBack} className={styles.backButton}>
          ← Volver
        </button>
        <h1 className={styles.headerTitle}>Detalle del Grupo</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.groupName}>{groupInfo.name}</h2>
          {groupInfo.description && (
            <p className={styles.description}>{groupInfo.description}</p>
          )}
          {groupInfo.course && (
            <div className={styles.courseInfo}>
              <span className={styles.courseIcon}>📚</span>
              <span className={styles.courseName}>{groupInfo.course.name}</span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Miembros</h3>
          <MemberList
            memberships={groupInfo.memberships || []}
            canManage={groupInfo.canManageMembers || false}
            ownerId={groupInfo.owner_id}
          />
        </div>
      </div>
    </div>
  );
};
