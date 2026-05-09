import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectionRequest as ConnectionRequestComponent } from './ConnectionRequest';
import { useConnections } from '../hooks/useConnections';
import { LoadingSpinner } from '@/components/elements';
import { Handshake, Users, MessageCircle } from 'lucide-react';
import styles from './ConnectionList.module.css';

export const ConnectionList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'solicitudes' | 'amigos'>('solicitudes');
  const {
    pendingRequests,
    myConnections,
    isLoading,
    isLoadingConnections,
    isError,
    refetch,
    openDirectMessage,
  } = useConnections();

  const handleOpenChat = async (userId: number) => {
    await openDirectMessage(userId, (path) => navigate(path));
  };

  const renderSolicitudesTab = () => {
    if (isLoading) {
      return <LoadingSpinner size="lg" label="Cargando solicitudes..." />;
    }

    if (isError) {
      return (
        <div className={styles.center}>
          <p className={styles.errorText}>Error al cargar solicitudes</p>
          <button className={styles.retryButton} onClick={refetch}>
            Reintentar
          </button>
        </div>
      );
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return (
        <div className={styles.center}>
          <Handshake size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>No tienes solicitudes pendientes</p>
        </div>
      );
    }

    return (
      <ul className={styles.list}>
        {pendingRequests.map((request) => (
          <ConnectionRequestComponent
            key={request.id_connection}
            request={request}
            onUpdated={refetch}
          />
        ))}
      </ul>
    );
  };

  const renderAmigosTab = () => {
    if (isLoadingConnections) {
      return <LoadingSpinner size="lg" label="Cargando amigos..." />;
    }

    if (!myConnections || myConnections.length === 0) {
      return (
        <div className={styles.center}>
          <Users size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>No tienes amigos conectados aún</p>
        </div>
      );
    }

    return (
      <ul className={styles.list}>
        {myConnections.map((connection) => {
          const friend = connection.requester || connection.adressee;
          return (
            <li key={connection.id_connection} className={styles.friendCard}>
              <div className={styles.friendInfo}>
                <div className={styles.friendAvatar}>
                  {friend?.picture ? (
                    <img src={friend.picture} alt={friend.full_name} className={styles.avatarImg} />
                  ) : (
                    <Users size={24} />
                  )}
                </div>
                <div>
                  <p className={styles.friendName}>{friend?.full_name || 'Usuario'}</p>
                  <p className={styles.friendProgram}>{friend?.program?.name || ''}</p>
                </div>
              </div>
              <button
                className={styles.chatButton}
                onClick={() => handleOpenChat(friend?.id_user || 0)}
                title="Abrir chat"
              >
                <MessageCircle size={18} />
                <span>Chat</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Conexiones</h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${activeTab === 'solicitudes' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('solicitudes')}
        >
          <Handshake size={18} />
          Solicitudes
          {pendingRequests && pendingRequests.length > 0 && (
            <span className={styles.tabBadge}>{pendingRequests.length}</span>
          )}
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'amigos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('amigos')}
        >
          <Users size={18} />
          Mis Amigos
          {myConnections && myConnections.length > 0 && (
            <span className={styles.tabBadge}>{myConnections.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className={styles.tabContent}>
        {activeTab === 'solicitudes' ? renderSolicitudesTab() : renderAmigosTab()}
      </div>
    </div>
  );
};
