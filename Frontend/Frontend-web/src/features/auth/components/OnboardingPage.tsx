import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { OnboardingScreen } from './OnboardingScreen';
import { LoadingSpinner } from '@/components/elements';
import { authStore } from '../store/AuthStore';
import { authService } from '../services';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import { showToast } from '@/lib/toast';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: programs, isLoading, error } = usePrograms();

  // Guard: if user already completed onboarding, redirect to events
  if (!authStore.needsOnboarding) {
    return <Navigate to="/events" replace />;
  }

  const handleComplete = async (data: { id_program: number; current_semester: number }) => {
    try {
      await authService.completeOnboarding(data.id_program, data.current_semester);
      authStore.setNeedsOnboarding(false);
      showToast.success('Perfil completado', 'Bienvenido a Uniconnect');
      navigate('/events', { replace: true });
    } catch (err: any) {
      showToast.error('Error', err.message || 'No se pudo completar el perfil');
      throw err;
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Cargando programas..." />;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <p style={{ color: '#ff4d4d' }}>Error al cargar programas: {error.message}</p>
      </div>
    );
  }

  return (
    <OnboardingScreen
      onComplete={handleComplete}
      programs={programs || []}
    />
  );
};
