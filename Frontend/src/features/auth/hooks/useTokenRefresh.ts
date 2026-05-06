import { useEffect, useRef } from 'react';
import { authController } from '../controllers/AuthController';
import { authStore } from '../store/AuthStore';

export function useTokenRefresh() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false); // Guard against concurrent refreshes
  const lastRefreshTimestamp = useRef<number>(0); // Prevent rapid refreshes

  useEffect(() => {
    const checkAndRefreshTokens = async () => {
      // Prevent concurrent refresh attempts
      if (isRefreshingRef.current) {
        
        return;
      }

      // Only check if user is authenticated
      if (!authStore.isAuthenticated) {
        return;
      }

      // Check if tokens need refresh (5 minutes before expiration)
      const fiveMinutesInMs = 5 * 60 * 1000;
      const shouldRefresh = authStore.auth0Tokens?.expires_at 
        ? (authStore.auth0Tokens.expires_at - Date.now()) < fiveMinutesInMs
        : false;

      if (shouldRefresh && authStore.hasRefreshToken) {
        // Prevent refreshing more than once per minute (safety measure)
        const timeSinceLastRefresh = Date.now() - lastRefreshTimestamp.current;
        if (timeSinceLastRefresh < 60 * 1000) {
          
          return;
        }

        
        isRefreshingRef.current = true;
        try {
          await authController.refreshTokens();
          lastRefreshTimestamp.current = Date.now();
        } finally {
          isRefreshingRef.current = false;
        }
      }
    };

    // Check immediately
    checkAndRefreshTokens();

    // Set up periodic checks every 5 minutes (instead of 2 minutes for better performance)
    intervalRef.current = setInterval(checkAndRefreshTokens, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refreshNow = async () => {
    return await authController.refreshTokens();
  };

  return {
    refreshNow,
  };
}