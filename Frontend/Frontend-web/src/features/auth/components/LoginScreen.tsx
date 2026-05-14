import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../store/AuthStore';
import { observer } from 'mobx-react-lite';
import { useWebAuth } from '../hooks/useWebAuth';
import { Lock } from 'lucide-react';
import ucaldasLogo from '../../../../assets/Logo_de_la_Universidad_de_Caldas.svg.png';
import styles from './LoginScreen.module.css';

export const LoginScreen: React.FC = observer(() => {
  const { isLoading, error, loginWithAuth0, logout } = useWebAuth();
  const navigate = useNavigate();

  // Redirect once authenticated — respect onboarding state
  useEffect(() => {
    if (authStore.isAuthenticated && authStore.isReady) {
      navigate(authStore.needsOnboarding ? '/onboarding' : '/events', { replace: true });
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
          <img src={ucaldasLogo} alt="Universidad de Caldas" className={styles.ucaldasLogo} />
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
                Iniciar sesión
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
