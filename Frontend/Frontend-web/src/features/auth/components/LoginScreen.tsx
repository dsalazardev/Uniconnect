import React from 'react';
import { authStore } from '../store/AuthStore';
import { observer } from 'mobx-react-lite';
import styles from './LoginScreen.module.css';

export const LoginScreen: React.FC = observer(() => {
  const handleLogin = () => {
    // Placeholder para Auth0 web flow
    window.alert('Auth0 login flow - To be implemented');
  };

  if (authStore.isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.welcomeText}>
            Bienvenido, {authStore.user?.full_name}
          </h2>
          <button onClick={() => authStore.clearAuth()} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <div className={styles.logoPlaceholder}>🎓</div>
        </div>

        {/* Title */}
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>UniConnect</h1>
          <p className={styles.subtitle}>Universidad de Caldas</p>
          <div className={styles.divider} />
        </div>

        {/* Login Button */}
        <div className={styles.loginContainer}>
          <button onClick={handleLogin} className={styles.loginButton}>
            <span className={styles.googleIcon}>🔐</span>
            Iniciar sesión con Google
          </button>
        </div>

        {/* Footer */}
        <p className={styles.footer}>Inicia sesión con tu cuenta institucional</p>
      </div>
    </div>
  );
});
