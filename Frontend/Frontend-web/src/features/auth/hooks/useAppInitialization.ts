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
          // needsOnboarding is set only at login time (auth0Callback) and persisted
          // in sessionStorage — do not override it from the profile endpoint, since
          // the profile cannot distinguish "new user" from "existing user without program".
          try {
            await authService.getUserProfile();
          } catch {
            // Non-fatal — cached session data remains valid
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