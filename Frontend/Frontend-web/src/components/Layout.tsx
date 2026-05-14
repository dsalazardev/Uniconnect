import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Home, Users, GitBranch, Calendar, MessageCircle, UserCircle, LogOut, SlidersHorizontal, Menu, X, HelpCircle } from 'lucide-react';
import { authStore } from '@/features/auth/store/AuthStore';
import { notificationsService } from '@/features/notifications/services';
import { notificationsStore } from '@/features/notifications/store/notifications.store';
import { NotificationCenter } from '@/features/notifications/components/NotificationCenter';
import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';
import { useRealtimeNotifications } from '@/features/notifications/hooks/useRealtimeNotifications';
import { useNotificationPolling } from '@/features/notifications/hooks/useNotificationPolling.tsx';
import { ConfirmModal } from '@/components/ConfirmModal';
import styles from './Layout.module.css';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authStore.accessToken !== null;
  const unreadCount = notificationsStore.unreadCount;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Iniciar observadores de notificaciones (real-time + polling)
  useRealtimeNotifications();
  useNotificationPolling();

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

  // Close both panels on route change
  useEffect(() => {
    setIsNotificationsOpen(false);
    setIsMenuOpen(false);
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

  // ESC closes any open panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsMenuOpen(false);
      }
    };

    if (isNotificationsOpen || isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationsOpen, isMenuOpen]);

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

  // Onboarding is fullscreen — render without navbar
  if (location.pathname === '/onboarding') {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Outlet />
      </>
    );
  }

  return (
    <div className={styles.layout}>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <nav className={styles.navbar}>
        {/* Left: hamburger + brand */}
        <div className={styles.navLeft}>
          <button
            className={styles.hamburgerBtn}
            onClick={() => setIsMenuOpen((p) => !p)}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className={styles.navBrand}>
            <Link to="/" className={styles.brandLink}>Uniconnect</Link>
          </div>
        </div>

        {/* Right: notifications + logout */}
        <div className={styles.navActions}>
          <NotificationBadge
            onPress={toggleNotifications}
            className={styles.navLink}
            size={18}
          />
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Slide-in menu panel */}
      <div
        ref={menuRef}
        className={`${styles.menuPanel} ${isMenuOpen ? styles.menuPanelOpen : ''}`}
      >
        <Link to="/events" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
          <Home size={18} /> Inicio
        </Link>
        <Link to="/profile" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
          <UserCircle size={18} /> Perfil
        </Link>
        <Link to="/students" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
          <Users size={18} /> Comunidad
        </Link>
        <Link to="/groups" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
          <MessageCircle size={18} /> Grupos
        </Link>
        <Link to="/connections" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
          <GitBranch size={18} /> Vínculos
        </Link>
        <Link to="/events" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
          <Calendar size={18} /> Eventos
        </Link>
        <Link to="/forum" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
          <HelpCircle size={18} /> Foro Académico
        </Link>
        <Link to="/notifications/preferences" className={styles.menuLink} onClick={() => setIsMenuOpen(false)}>
          <SlidersHorizontal size={18} /> Preferencias
        </Link>
      </div>

      {/* Overlay — closes menu on outside click */}
      {isMenuOpen && (
        <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />
      )}

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
