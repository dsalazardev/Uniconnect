import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';
import { groupsService } from '../services';
import { showToast } from '@/lib/toast';
import styles from './PendingTransferOwnerBanner.module.css';

interface PendingTransferOwnerBannerProps {
  candidateName?: string;
  groupId: number;
  onResolved?: () => void;
}

export const PendingTransferOwnerBanner: React.FC<PendingTransferOwnerBannerProps> = ({
  candidateName,
  groupId,
  onResolved,
}) => {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await groupsService.cancelOwnershipTransfer(groupId);
      showToast.success('Transferencia cancelada');
      onResolved?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar la transferencia';
      showToast.error('Error', msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const message = candidateName
    ? `La transferencia de administrador a ${candidateName} está pendiente. No puedes salir del grupo hasta que el candidato acepte o rechace la transferencia.`
    : 'La transferencia de administrador está pendiente. No puedes salir del grupo hasta que el candidato acepte o rechace la transferencia.';

  return (
    <div className={styles.banner}>
      <Clock size={20} className={styles.icon} />
      <p className={styles.text}>{message}</p>
      <button
        className={styles.cancelButton}
        onClick={handleCancel}
        disabled={isCancelling}
        title="Cancelar transferencia"
      >
        {isCancelling ? <span className={styles.spinner} /> : <X size={16} />}
        <span>Cancelar</span>
      </button>
    </div>
  );
};
