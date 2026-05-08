import React from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../store/AuthStore';
import { AlertTriangle, User } from 'lucide-react';
import styles from './ProfileScreen.module.css';

export const ProfileScreen: React.FC = observer(() => {
  const user = authStore.user;

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <p className={styles.errorText}>No hay usuario autenticado</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          {user.picture ? (
            <img src={user.picture} alt={user.full_name} className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <User size={48} className={styles.avatarIcon} />
            </div>
          )}
          <h1 className={styles.name}>{user.full_name}</h1>
          <p className={styles.email}>{user.email}</p>
        </div>

        {/* Info Sections */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Información Académica</h2>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Rol:</span>
            <span className={styles.infoValue}>{user.role?.name || user.roleName || 'N/A'}</span>
          </div>
          {user.id_program && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Programa:</span>
              <span className={styles.infoValue}>ID {user.id_program}</span>
            </div>
          )}
          {user.current_semester && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Semestre:</span>
              <span className={styles.infoValue}>{user.current_semester}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button onClick={() => authStore.clearAuth()} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
});
