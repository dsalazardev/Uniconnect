import { useEffect, useRef } from 'react';
import { authStore } from '../store/AuthStore';
import { authService } from '../services';

export function useTokenRefresh() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const lastRefreshTimestamp = useRef<number>(0);

  useEffect(() => {
    const checkAndRefreshTokens = async () => {
      if (isRefreshingRef.current) {
        return;
      }

      if (!authStore.isAuthenticated) {
        return;
      }

      const fiveMinutesInMs = 5 * 60 * 1000;
      const shouldRefresh = authStore.auth0Tokens?.expires_at
        ? (authStore.auth0Tokens.expires_at - Date.now()) < fiveMinutesInMs
        : false;

      if (shouldRefresh && authStore.hasRefreshToken) {
        const timeSinceLastRefresh = Date.now() - lastRefreshTimestamp.current;
        if (timeSinceLastRefresh < 60 * 1000) {
          return;
        }

        isRefreshingRef.current = true;
        try {
          const refreshToken = authStore.auth0Tokens?.refresh_token;
          const userId = authStore.user?.id_user;
          if (refreshToken && userId) {
            const result = await authService.refreshTokens(refreshToken, userId);
            if (result.success && result.data) {
              const { access_token, user, auth0_tokens } = result.data as any;
              authStore.setAuth(access_token, user, auth0_tokens);
              lastRefreshTimestamp.current = Date.now();
            } else {
              console.error('Token refresh failed:', result.message);
              authStore.clearAuth();
            }
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          authStore.clearAuth();
        } finally {
          isRefreshingRef.current = false;
        }
      }
    };

    checkAndRefreshTokens();

    intervalRef.current = setInterval(checkAndRefreshTokens, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    refreshNow: async () => {
      const refreshToken = authStore.auth0Tokens?.refresh_token;
      const userId = authStore.user?.id_user;
      if (refreshToken && userId) {
        return authService.refreshTokens(refreshToken, userId);
      }
      return { success: false, message: 'No refresh token available' } as any;
    },
  };
}