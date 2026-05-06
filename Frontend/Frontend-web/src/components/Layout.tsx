import { Link, Outlet, useNavigate } from 'react-router-dom';
import { authStore } from '@/features/auth/store/AuthStore';
import styles from './Layout.module.css';

export const Layout = () => {
  const navigate = useNavigate();
  const isAuthenticated = authStore.accessToken !== null;

  const handleLogout = () => {
    authStore.clearAuth();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <Link to="/" className={styles.brandLink}>
            Uniconnect
          </Link>
        </div>
        
        <div className={styles.navLinks}>
          <Link to="/events" className={styles.navLink}>
            Eventos
          </Link>
          <Link to="/groups" className={styles.navLink}>
            Grupos
          </Link>
          <Link to="/messages" className={styles.navLink}>
            Mensajes
          </Link>
          <Link to="/students" className={styles.navLink}>
            Estudiantes
          </Link>
          <Link to="/connections" className={styles.navLink}>
            Conexiones
          </Link>
          <Link to="/courses" className={styles.navLink}>
            Cursos
          </Link>
          <Link to="/programs" className={styles.navLink}>
            Programas
          </Link>
          <Link to="/notifications" className={styles.navLink}>
            Notificaciones
          </Link>
        </div>

        <div className={styles.navActions}>
          <Link to="/profile" className={styles.navLink}>
            Perfil
          </Link>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};
