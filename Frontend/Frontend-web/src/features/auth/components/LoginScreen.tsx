import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../store/AuthStore';
import { observer } from 'mobx-react-lite';
import { useWebAuth } from '../hooks/useWebAuth';
import { GraduationCap, Lock } from 'lucide-react';
import styles from './LoginScreen.module.css';

export const LoginScreen: React.FC = observer(() => {
  const { isLoading, error, loginWithAuth0, logout } = useWebAuth();
  const navigate = useNavigate();

  // Redirect to events if already authenticated
  useEffect(() => {
    if (authStore.isAuthenticated && authStore.isReady) {
      navigate('/events', { replace: true });
    }
  }, [authStore.isAuthenticated, authStore.isReady, navigate]);

  if (authStore.isAuthenticated && !isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.welcomeText}>
            Bienvenido, {authStore.user?.full_name}
          </h2>
          <button onClick={logout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <div className={styles.logoContainer}>
          <GraduationCap size={48} className={styles.logoPlaceholder} />
        </div>

        <div className={styles.titleContainer}>
          <h1 className={styles.title}>UniConnect</h1>
          <p className={styles.subtitle}>Universidad de Caldas</p>
          <div className={styles.divider} />
        </div>

        <div className={styles.loginContainer}>
          <button
            onClick={loginWithAuth0}
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Cargando...</span>
            ) : (
              <>
                <Lock size={20} className={styles.googleIcon} />
                Iniciar sesión con Auth0
              </>
            )}
          </button>
        </div>

        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        <p className={styles.footer}>Inicia sesión con tu cuenta institucional @ucaldas.edu.co</p>
      </div>
    </div>
  );
});
