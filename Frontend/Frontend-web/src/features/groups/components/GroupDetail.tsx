import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupInfo } from '../hooks/useGroupInfo';
import { MemberList } from './MemberList';
import { ArrowLeft, AlertTriangle, BookOpen } from 'lucide-react';
import styles from './GroupDetail.module.css';

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = parseInt(id as string);
  const { data: groupInfo, isLoading, error } = useGroupInfo(groupId);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <ArrowLeft size={20} /> Volver
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
            <ArrowLeft size={20} /> Volver
          </button>
          <h1 className={styles.headerTitle}>Error</h1>
        </div>
        <div className={styles.errorContainer}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <p className={styles.errorText}>{error?.message || 'Grupo no encontrado'}</p>
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
          <ArrowLeft size={20} /> Volver
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
              <BookOpen size={20} className={styles.courseIcon} />
              <span className={styles.courseName}>{groupInfo.course.name}</span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Miembros</h3>
          <MemberList
            memberships={groupInfo.memberships || []}
            canManage={groupInfo.canManageMembers || false}
            ownerId={groupInfo.owner.id_user}
          />
        </div>
      </div>
    </div>
  );
};
