import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { useConnectionStatus, useConnections } from '@/features/connections/hooks/useConnections';
import { ArrowLeft, Smartphone, UserPlus, UserCheck, Send, MessageCircle, X, Check } from 'lucide-react';
import styles from './StudentProfile.module.css';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const targetUserId = Number(id);
  const { data: profile, isLoading, error } = useStudentProfile(targetUserId);
  const {
    connectionStatus,
    isLoadingStatus,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    isSendingRequest,
    isAccepting,
    isRejecting,
  } = useConnectionStatus(targetUserId);
  const { openDirectMessage } = useConnections();

  const getImageUri = (picture?: string): string => {
    if (!picture) return 'https://via.placeholder.com/120';
    if (picture.startsWith('http')) return picture;
    return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${picture}`;
  };

  if (isLoading) {
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
        <p className={styles.errorText}>{error?.message || 'Perfil no encontrado'}</p>
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

      {/* Connection Status */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Conexión</h2>
        {isLoadingStatus ? (
          <div className={styles.connectionLoading}>
            <div className={styles.spinnerSmall} />
            <span className={styles.connectionLoadingText}>Verificando conexión...</span>
          </div>
        ) : !connectionStatus ? (
          <div className={styles.connectionActions}>
            <button
              onClick={() => sendConnectionRequest({ addressee_id: targetUserId })}
              disabled={isSendingRequest}
              className={styles.connectButton}
            >
              <UserPlus size={18} />
              {isSendingRequest ? 'Enviando...' : 'Conectar'}
            </button>
          </div>
        ) : connectionStatus.status === 'pending' ? (
          <div>
            {connectionStatus.is_requester ? (
              <div className={styles.connectionStatusInfo}>
                <Send size={18} className={styles.statusIcon} />
                <span className={styles.connectionStatusText}>Solicitud de conexión enviada</span>
              </div>
            ) : (
              <div className={styles.connectionActions}>
                <button
                  onClick={() => connectionStatus.id_connection && acceptConnectionRequest(connectionStatus.id_connection)}
                  disabled={isAccepting || !connectionStatus.id_connection}
                  className={styles.acceptButton}
                >
                  <Check size={18} />
                  {isAccepting ? 'Aceptando...' : 'Aceptar'}
                </button>
                <button
                  onClick={() => connectionStatus.id_connection && rejectConnectionRequest(connectionStatus.id_connection)}
                  disabled={isRejecting || !connectionStatus.id_connection}
                  className={styles.rejectButton}
                >
                  <X size={18} />
                  {isRejecting ? 'Rechazando...' : 'Rechazar'}
                </button>
              </div>
            )}
          </div>
        ) : connectionStatus.status === 'accepted' ? (
          <div className={styles.connectionStatusInfo}>
            <UserCheck size={18} className={styles.friendIcon} />
            <span className={styles.friendText}>Amigos</span>
            <button
              onClick={() => openDirectMessage(targetUserId)}
              className={styles.messageButton}
            >
              <MessageCircle size={18} />
              Enviar Mensaje
            </button>
          </div>
        ) : null}
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
