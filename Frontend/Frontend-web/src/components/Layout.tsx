import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Home, Users, GitBranch, Bell, Calendar, MessageCircle, UserCircle, LogOut } from 'lucide-react';
import { authStore } from '@/features/auth/store/AuthStore';
import { notificationsService } from '@/features/notifications/services';
import { notificationsStore } from '@/features/notifications/store/notifications.store';
import styles from './Layout.module.css';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authStore.accessToken !== null;
  const unreadCount = notificationsStore.unreadCount;

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadUnreadCount = async () => {
      try {
        const data = await notificationsService.getUnreadCount();
        notificationsStore.setUnreadCount(data.count);
      } catch {
      }
    };
    loadUnreadCount();
  }, [isAuthenticated]);

  const handleLogout = () => {
    authStore.clearAuth();
    navigate('/login');
  };

  if (!isAuthenticated) {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  }

  return (
    <div className={styles.layout}>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <Link to="/" className={styles.brandLink}>
            Uniconnect
          </Link>
        </div>
        
        <div className={styles.navLinks}>
          <Link to="/events" className={styles.navLink}>
            <Home size={18} />
            Inicio
          </Link>
          <Link to="/profile" className={styles.navLink}>
            <UserCircle size={18} />
            Perfil
          </Link>
          <Link to="/students" className={styles.navLink}>
            <Users size={18} />
            Comunidad
          </Link>
          <Link to="/groups" className={styles.navLink}>
            <MessageCircle size={18} />
            Grupos
          </Link>
          <Link to="/connections" className={styles.navLink}>
            <GitBranch size={18} />
            Vínculos
          </Link>
          <Link to="/events" className={styles.navLink}>
            <Calendar size={18} />
            Eventos
          </Link>
          <Link to="/notifications" className={styles.navLink}>
            <Bell size={18} />
            Notificaciones
            {unreadCount > 0 && (
              <span className={styles.badge}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        <div className={styles.navActions}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={18} />
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
