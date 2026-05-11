import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { usePerfilCompleto } from '../hooks/usePerfilEstudiante';
import { LoadingSpinner } from '@/components/elements';
import { useConnectionStatus, useConnections } from '@/features/connections/hooks/useConnections';
import { authStore } from '@/features/auth/store/AuthStore';
import { ArrowLeft, Smartphone, UserPlus, UserCheck, Send, MessageCircle, X, Check, BarChart2, Award } from 'lucide-react';
import styles from './StudentProfile.module.css';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserId = Number(id);
  const currentUser = authStore.user;
  const isOwnProfile = currentUser?.id_user === targetUserId;
  const vistaCompleta = searchParams.get('vista') === 'completa';

  const { data: profile, isLoading, error } = useStudentProfile(targetUserId);
  const { data: perfilCompleto, isLoading: loadingCompleto, error: errorCompleto } = usePerfilCompleto(
    targetUserId,
    vistaCompleta,
  );
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
    return <LoadingSpinner size="lg" label="Cargando perfil..." />;
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
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/students')}>
          <ArrowLeft size={20} /> Volver
        </button>
        <button
          className={vistaCompleta ? styles.vistaBaseButton : styles.vistaCompletaButton}
          onClick={() => {
            const next = vistaCompleta ? `/students/${id}` : `/students/${id}?vista=completa`;
            navigate(next);
          }}
        >
          {vistaCompleta ? 'Ver perfil base' : 'Ver perfil completo'}
        </button>
      </div>

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
      {!isOwnProfile && (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Conexión</h2>
        {isLoadingStatus ? (
          <div className={styles.connectionLoading}>
            <div className={styles.spinnerSmall} />
            <span className={styles.connectionLoadingText}>Verificando conexión...</span>
          </div>
        ) : !connectionStatus || connectionStatus.status === 'none' ? (
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
              onClick={() => openDirectMessage(targetUserId, navigate)}
              className={styles.messageButton}
            >
              <MessageCircle size={18} />
              Enviar Mensaje
            </button>
          </div>
        ) : null}
      </div>
      )}

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

      {/* US-D02: Secciones del perfil completo (decoradores) */}
      {vistaCompleta && loadingCompleto && (
        <LoadingSpinner size="sm" label="Cargando perfil completo..." />
      )}

      {vistaCompleta && errorCompleto && (
        <div className={styles.section}>
          <p className={styles.errorText}>Error al cargar el perfil completo: {errorCompleto}</p>
        </div>
      )}

      {vistaCompleta && perfilCompleto && (
        <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <BarChart2 size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Estadísticas
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Grupos creados:</span>
                <span className={styles.infoValue}>{perfilCompleto.estadisticas.gruposCreados}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Grupos en los que participa:</span>
                <span className={styles.infoValue}>{perfilCompleto.estadisticas.gruposParticipa}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Mensajes enviados:</span>
                <span className={styles.infoValue}>{perfilCompleto.estadisticas.mensajesEnviados}</span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Award size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Insignias
            </h2>
            {perfilCompleto.insignias.length === 0 ? (
              <p className={styles.emptyText}>Aún no has desbloqueado insignias. ¡Sigue participando!</p>
            ) : (
              <div className={styles.insigniasGrid}>
                {perfilCompleto.insignias.map((insignia) => (
                  <div key={insignia.id} className={styles.insigniaCard} title={insignia.descripcion}>
                    <span className={styles.insigniaIcono}>{insignia.icono}</span>
                    <span className={styles.insigniaNombre}>{insignia.nombre}</span>
                    <span className={styles.insigniaDesc}>{insignia.descripcion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
