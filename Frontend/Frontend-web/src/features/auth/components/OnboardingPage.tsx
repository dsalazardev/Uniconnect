import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { OnboardingScreen } from './OnboardingScreen';
import { authStore } from '../store/AuthStore';
import { authService } from '../services';
import { showToast } from '@/lib/toast';

export const OnboardingPage: React.FC = observer(() => {
  const navigate = useNavigate();

  // Only new users (needsOnboarding=true set at login) reach this page
  if (!authStore.needsOnboarding) {
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
