/**
 * Shared Axios instance for Frontend-web
 *
 * Single source of truth for API client configuration.
 * Uses createApiClient() from @uniconnect/shared with AuthProvider connected to AuthStore.
 * Token refresh mutex + queue (FIX-10) and auth-ready guard are built in.
 */
import { createApiClient, AuthService } from '@uniconnect/shared';
import { authStore } from '@/features/auth/store/AuthStore';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8007/api';

const authService = new AuthService(
  createApiClient({
    baseURL: API_BASE_URL,
    authProvider: {
      getAccessToken: () => null,
      isTokenExpired: () => false,
      hasRefreshToken: () => false,
      isRefreshing: () => false,
      isReady: () => false,
      isInitialized: () => true,
      refreshTokens: async () => ({ success: false, errorCode: 'UNKNOWN' as const, message: 'Bootstrap client' }),
      clearAuth: () => {},
    },
    timeout: 10000,
    enableFENValidation: false,
    debug: false,
  })
);

export const api = createApiClient({
  baseURL: API_BASE_URL,
  authProvider: {
    getAccessToken: () => authStore.accessToken,
    isTokenExpired: () => authStore.isTokenExpired,
    hasRefreshToken: () => authStore.hasRefreshToken,
    isRefreshing: () => authStore.isRefreshing,
    isReady: () => authStore.isInitialized && !!authStore.accessToken,
    isInitialized: () => authStore.isInitialized,
    refreshTokens: async () => {
      try {
        if (!authStore.hasRefreshToken || !authStore.auth0Tokens?.refresh_token || !authStore.user?.id_user) {
          return { success: false, errorCode: 'INVALID_CREDENTIALS' as const, message: 'Missing refresh token' };
        }

        authStore.isRefreshing = true;

        const response = await authService.refreshTokens(
          authStore.auth0Tokens.refresh_token,
          authStore.user.id_user
        );

        if (response.success && response.data) {
          const data = response.data as {
            access_token: string;
            user: any;
            auth0_tokens?: any;
          };
          authStore.setAuth(data.access_token, data.user, data.auth0_tokens);
          return {
            success: true,
            tokens: { accessToken: data.access_token },
          };
        }

        authStore.clearAuth();
        return {
          success: false,
          errorCode: 'TOKEN_EXPIRED' as const,
          message: response.message || 'Token refresh failed',
        };
      } catch (error) {
        authStore.clearAuth();
        return {
          success: false,
          errorCode: 'UNKNOWN' as const,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      } finally {
        authStore.isRefreshing = false;
      }
    },
    clearAuth: () => authStore.clearAuth(),
  },
  timeout: 10000,
  enableFENValidation: true,
  debug: false,
});

export const WEBSOCKET_URL = (import.meta.env.VITE_WEBSOCKET_URL as string | undefined) ?? 'http://localhost:8007';
