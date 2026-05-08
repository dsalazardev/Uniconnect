import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConnectionRequest as ConnectionRequestType } from '@uniconnect/shared';
import { connectionsService } from '../services';
import { Check, X } from 'lucide-react';
import styles from './ConnectionRequest.module.css';

interface ConnectionRequestProps {
  request: ConnectionRequestType;
  onUpdated?: () => void;
}

export const ConnectionRequest: React.FC<ConnectionRequestProps> = ({ request, onUpdated }) => {
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getImageUri = (picture?: string): string => {
    if (!picture) return 'https://via.placeholder.com/60';
    if (picture.startsWith('http')) return picture;
    return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${picture}`;
  };

  const handleViewProfile = () => {
    navigate(`/students/${request.requester.id_user}`);
  };

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      await connectionsService.acceptConnectionRequest(request.id_connection);
      window.alert(`¡Solicitud aceptada! ${request.requester.full_name} ahora es tu conexión.`);
      onUpdated?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      window.alert(err?.response?.data?.message || 'No se pudo aceptar la solicitud.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      await connectionsService.rejectConnectionRequest(request.id_connection);
      window.alert(`Has rechazado la solicitud de ${request.requester.full_name}.`);
      onUpdated?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      window.alert(err?.response?.data?.message || 'No se pudo rechazar la solicitud.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <li className={styles.card}>
      <div className={styles.leftSection} onClick={handleViewProfile}>
        <img
          src={getImageUri(request.requester.picture)}
          alt={request.requester.full_name}
          className={styles.avatar}
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.name} onClick={handleViewProfile}>
          {request.requester.full_name}
        </h3>
        <p className={styles.program}>{request.requester.program?.name}</p>
        <span className={styles.time}>{formatTime(request.request_at)}</span>

        <div className={styles.actions}>
          <button
            className={`${styles.actionButton} ${styles.acceptButton}`}
            onClick={handleAccept}
            disabled={isAccepting || isRejecting}
          >
            {isAccepting ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <Check size={16} className={styles.icon} />
                <span>Aceptar</span>
              </>
            )}
          </button>

          <button
            className={`${styles.actionButton} ${styles.rejectButton}`}
            onClick={handleReject}
            disabled={isAccepting || isRejecting}
          >
            {isRejecting ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <X size={16} className={styles.icon} />
                <span>Rechazar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </li>
  );
};
