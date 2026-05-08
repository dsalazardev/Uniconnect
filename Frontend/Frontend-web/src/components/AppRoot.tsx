import React from 'react';
import { Loader } from 'lucide-react';
import { authStore } from '@/features/auth/store/AuthStore';
import styles from './AppRoot.module.css';

interface AppRootProps {
  children: React.ReactNode;
}

export const AppRoot: React.FC<AppRootProps> = ({ children }) => {
  if (!authStore.isInitialized) {
    return (
      <div className={styles.container}>
        <Loader size={48} className={styles.spinner} />
        <p className={styles.text}>Inicializando...</p>
      </div>
    );
  }

  return <>{children}</>;
};
