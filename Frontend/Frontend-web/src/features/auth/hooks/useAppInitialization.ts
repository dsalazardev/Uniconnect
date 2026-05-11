import { useEffect, useState } from 'react';
import { authStore } from '../store/AuthStore';
import { authService } from '../services';

export function useAppInitialization() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // AuthStore hydrates from localStorage synchronously on construction,
        // so isInitialized is true immediately on web.
        if (authStore.isAuthenticated) {
          try {
            const profile = await authService.getUserProfile();
            // Keep needsOnboarding in sync with the server: true when id_program is null
            authStore.setNeedsOnboarding(profile.needsOnboarding ?? false);
          } catch {
            // Non-fatal — cached value from sessionStorage remains valid
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize app';
        console.error('App initialization error:', error);
        setInitializationError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  return {
    isInitializing,
    initializationError,
  };
}