import { createApiClient, NotificationsService } from '@uniconnect/shared';
import { authStore } from '@/features/auth/store/AuthStore';

const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8007/api',
  authProvider: {
    getAccessToken: () => authStore.accessToken,
    isTokenExpired: () => authStore.isTokenExpired,
    hasRefreshToken: () => authStore.hasRefreshToken,
    isRefreshing: () => authStore.isRefreshing,
    refreshTokens: async () => {
      throw new Error('Token refresh not yet implemented for web');
    },
    clearAuth: () => authStore.clearAuth(),
  },
  timeout: 10000,
  enableFENValidation: true,
  debug: false,
});

export const notificationsService = new NotificationsService(api);

// Notification observer for real-time updates (web implementation pending)
export const notificationObserver = {
  subscribe: (callback: () => void) => {
    console.log('Notification observer not yet implemented for web');
    return () => {}; // Unsubscribe function
  },
};
