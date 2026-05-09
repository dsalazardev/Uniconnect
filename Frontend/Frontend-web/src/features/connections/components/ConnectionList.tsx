import React from 'react';
import { ConnectionRequest as ConnectionRequestComponent } from './ConnectionRequest';
import { useConnections } from '../hooks/useConnections';
import { LoadingSpinner } from '@/components/elements';
import { Handshake } from 'lucide-react';
import styles from './ConnectionList.module.css';

export const ConnectionList: React.FC = () => {
  const { pendingRequests, loading, error, refetch } = useConnections();

  if (loading) {
    return <LoadingSpinner size="lg" label="Cargando solicitudes..." />;
  }

  if (error) {
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Solicitudes de Conexión</h1>
        <span className={styles.count}>{pendingRequests.length}</span>
      </div>

      <ul className={styles.list}>
        {pendingRequests.map((request) => (
          <ConnectionRequestComponent
            key={request.id_connection}
            request={request}
            onUpdated={refetch}
          />
        ))}
      </ul>
    </div>
  );
};
