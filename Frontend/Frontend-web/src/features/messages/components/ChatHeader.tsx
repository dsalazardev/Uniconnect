import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  isConnected?: boolean;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  isConnected = false,
  onBack,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={styles.header}>
      <button onClick={handleBack} className={styles.backButton} aria-label="Volver">
        ←
      </button>
      <div className={styles.headerInfo}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <div className={styles.statusContainer}>
        <span
          className={`${styles.statusDot} ${
            isConnected ? styles.connected : styles.disconnected
          }`}
        />
        <span className={styles.statusText}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
    </div>
  );
};
