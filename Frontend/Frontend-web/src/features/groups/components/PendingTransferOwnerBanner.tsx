import React from 'react';
import { Clock } from 'lucide-react';
import styles from './PendingTransferOwnerBanner.module.css';

interface PendingTransferOwnerBannerProps {
  candidateName?: string;
}

export const PendingTransferOwnerBanner: React.FC<PendingTransferOwnerBannerProps> = ({
  candidateName,
}) => {
  const message = candidateName
    ? `La transferencia de administrador a ${candidateName} está pendiente. No puedes salir del grupo hasta que el candidato acepte o rechace la transferencia.`
    : 'La transferencia de administrador está pendiente. No puedes salir del grupo hasta que el candidato acepte o rechace la transferencia.';

  return (
    <div className={styles.banner}>
      <Clock size={20} className={styles.icon} />
      <p className={styles.text}>{message}</p>
    </div>
  );
};
