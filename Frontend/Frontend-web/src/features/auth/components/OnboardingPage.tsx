import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { OnboardingScreen } from './OnboardingScreen';
import { authStore } from '../store/AuthStore';
import { authService } from '../services';
import { showToast } from '@/lib/toast';

export const OnboardingPage: React.FC = observer(() => {
  const navigate = useNavigate();

  // Show onboarding only when BOTH id_program AND current_semester are null
  const user = authStore.user as any;
  const needsOnboarding =
    authStore.needsOnboarding ||
    (user && user.id_program == null && user.current_semester == null);

  if (!needsOnboarding) {
    return <Navigate to="/events" replace />;
  }

  const handleComplete = async (data: { id_program: number; current_semester: number }) => {
    try {
      await authService.completeOnboarding(data.id_program, data.current_semester);
      authStore.setNeedsOnboarding(false);
      showToast.success('Perfil completado', '¡Bienvenido a UniConnect!');
      navigate('/events', { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        // Already completed — sync state and navigate
        authStore.setNeedsOnboarding(false);
        navigate('/events', { replace: true });
        return;
      }
      throw err;
    }
  };

  return <OnboardingScreen onComplete={handleComplete} />;
});
