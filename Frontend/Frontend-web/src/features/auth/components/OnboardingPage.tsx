import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { OnboardingScreen } from './OnboardingScreen';
import { authStore } from '../store/AuthStore';
import { authService } from '../services';
import { showToast } from '@/lib/toast';

export const OnboardingPage: React.FC = observer(() => {
  const navigate = useNavigate();

  const pendingToken = sessionStorage.getItem('pending_registration_token');
  const hasPendingRegistration = !!pendingToken;

  // Only allow access when there is a pending registration token (new user flow).
  // Authenticated users and unauthenticated users without the token are redirected.
  if (!hasPendingRegistration) {
    return <Navigate to={authStore.isAuthenticated ? '/events' : '/login'} replace />;
  }

  const handleComplete = async (data: { id_program: number; current_semester: number }) => {
    const token = sessionStorage.getItem('pending_registration_token');
    if (!token) {
      throw new Error('Token de registro no encontrado. Por favor inicia sesión de nuevo.');
    }

    const pendingAuth0Tokens = JSON.parse(
      sessionStorage.getItem('pending_auth0_tokens') || 'null'
    );

    const fenResponse = await authService.registerNewUser(token, data.id_program, data.current_semester);

    if (!fenResponse.success) {
      throw new Error(fenResponse.message || 'Error al registrar usuario.');
    }

    const { access_token, user } = fenResponse.data as any;

    // Clear pending data before setting auth to avoid stale state on error
    sessionStorage.removeItem('pending_registration_token');
    sessionStorage.removeItem('pending_auth0_tokens');

    authStore.setAuth(access_token, user, pendingAuth0Tokens);
    authStore.setNeedsOnboarding(false);

    showToast.success('Cuenta creada', '¡Bienvenido a UniConnect!');
    navigate('/events', { replace: true });
  };

  return <OnboardingScreen onComplete={handleComplete} />;
});
