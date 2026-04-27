import { useEffect, useState } from 'react';
import { authController } from '../controllers/AuthController';

export function useAppInitialization() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app authentication...');
        await authController.initializeAuth();
        console.log('App authentication initialized successfully');
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