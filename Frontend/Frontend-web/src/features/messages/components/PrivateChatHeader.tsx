import React from 'react';
import { User } from 'lucide-react';
import styles from './PrivateChatHeader.module.css';

interface PrivateChatHeaderProps {
  recipientName: string;
  recipientPicture?: string | null;
  isOnline: boolean;
}

export const PrivateChatHeader: React.FC<PrivateChatHeaderProps> = ({
  recipientName,
  recipientPicture,
  isOnline,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.avatarWrapper}>
        {recipientPicture ? (
          <img src={recipientPicture} alt={recipientName} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <User size={20} />
          </div>
        )}
        <span className={`${styles.presenceDot} ${isOnline ? styles.online : styles.offline}`} />
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{recipientName}</span>
        <span className={`${styles.status} ${isOnline ? styles.statusOnline : styles.statusOffline}`}>
          {isOnline ? 'En línea' : 'Desconectado'}
        </span>
      </div>
    </div>
  );
};
