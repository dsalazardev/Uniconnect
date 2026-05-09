import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Home, Users, GitBranch, Calendar, MessageCircle, UserCircle, LogOut } from 'lucide-react';
import { authStore } from '@/features/auth/store/AuthStore';
import { notificationsService } from '@/features/notifications/services';
import { notificationsStore } from '@/features/notifications/store/notifications.store';
import { NotificationCenter } from '@/features/notifications/components/NotificationCenter';
import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import styles from './Layout.module.css';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authStore.accessToken !== null;
  const unreadCount = notificationsStore.unreadCount;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

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

  // Close notifications popover on route change
  useEffect(() => {
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  // ESC key to close notifications
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationsOpen]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    authStore.clearAuth();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
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
          <NotificationBadge
            onPress={toggleNotifications}
            className={styles.navLink}
            size={18}
          />
        </div>

        <div className={styles.navActions}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Notifications Popover */}
      {isNotificationsOpen && (
        <div ref={notificationsRef} className={styles.notificationsPopover}>
          <NotificationCenter />
        </div>
      )}

      <main className={styles.mainContent}>
        <Outlet />
      </main>

      {/* Logout Confirmation */}
      <ConfirmModal
        visible={showLogoutConfirm}
        title="Cerrar Sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmLabel="Cerrar Sesión"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};
