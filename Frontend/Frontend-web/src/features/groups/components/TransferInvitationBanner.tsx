import React, { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import { groupsService } from '../services';
import { showToast } from '@/lib/toast';
import styles from './TransferInvitationBanner.module.css';

interface TransferInvitationBannerProps {
  groupId: number;
  ownerName?: string;
  onResolved?: () => void;
}

export const TransferInvitationBanner: React.FC<TransferInvitationBannerProps> = ({
  groupId,
  ownerName,
  onResolved,
}) => {
  const [actionLoading, setActionLoading] = useState<'accept' | 'decline' | null>(null);

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      await groupsService.acceptOwnershipTransfer(groupId);
      showToast.success('Transferencia aceptada', 'Ahora eres el administrador del grupo.');
      onResolved?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al aceptar la transferencia';
      showToast.error('Error', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    setActionLoading('decline');
    try {
      await groupsService.declineOwnershipTransfer(groupId);
      showToast.success('Transferencia rechazada');
      onResolved?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al rechazar la transferencia';
      showToast.error('Error', msg);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={styles.banner}>
      <Shield size={20} className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.text}>
          {ownerName
            ? `${ownerName} te ha transferido la administración de este grupo.`
            : 'Te han transferido la administración de este grupo.'}
        </p>
        <p className={styles.subtext}>Acepta para convertirte en el nuevo administrador.</p>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.acceptButton}
          onClick={handleAccept}
          disabled={actionLoading !== null}
        >
          {actionLoading === 'accept' ? <span className={styles.spinner} /> : <Check size={16} />}
          <span>Aceptar</span>
        </button>
        <button
          className={styles.declineButton}
          onClick={handleDecline}
          disabled={actionLoading !== null}
        >
          {actionLoading === 'decline' ? <span className={styles.spinner} /> : <X size={16} />}
          <span>Rechazar</span>
        </button>
      </div>
    </div>
  );
};
