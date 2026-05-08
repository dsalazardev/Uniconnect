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
          // Fetch fresh profile to get up-to-date needsOnboarding status
          try {
            const profile = await authService.getUserProfile();
            authStore.setNeedsOnboarding(profile.needsOnboarding ?? false);
          } catch {
            // Use cached needsOnboarding — don't fail initialization
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