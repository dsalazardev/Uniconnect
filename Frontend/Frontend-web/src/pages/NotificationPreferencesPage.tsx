import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NotificationPreferences } from '@/features/notifications/components';
import styles from './NotificationPreferencesPage.module.css';

export const NotificationPreferencesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} type="button">
          <ArrowLeft size={20} />
          Volver
        </button>
        <h1 className={styles.title}>Preferencias de notificaciones</h1>
      </header>
      <NotificationPreferences />
    </div>
  );
};
