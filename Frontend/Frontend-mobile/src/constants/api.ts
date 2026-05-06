import axios, { AxiosRequestConfig } from 'axios';
import { authStore } from '@/src/features/auth/store/AuthStore';

// ============================================================================
// FIX-10: Type Definitions for Token Refresh with Mutex & Promise Queueing
// ============================================================================

/**
 * Callback for queued requests during token refresh
 * Resolves with the retried response or errors if refresh fails
 */
type QueueCallback = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

/**
 * Error result from refresh failure
 */
interface RefreshError {
  code: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'SERVER_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  statusCode?: number;
}

// ============================================================================
// Global State for Mutex & Promise Queueing (REQ-1)
// ============================================================================

/**
 * Flag to prevent concurrent refresh token requests
 * When true: POST /auth/refresh is in progress
 * When false: No refresh in progress
 */
let isRefreshing: boolean = false;

/**
 * Queue of failed requests waiting for token refresh to complete
 * Each item contains resolve/reject callbacks to execute when refresh finishes
 * FIX-10 REQ-1: This ensures concurrent 401s don't trigger multiple refresh calls
 */
let failedQueue: QueueCallback[] = [];

/**
 * Process the queue of failed requests after token refresh completes
 * - If error is null and token is provided: Retry all queued requests with new token
 * - If error is provided: Reject all queued requests with the error
 *
 * FIX-10 REQ-2: Graceful degradation - handle refresh failures cleanly
 *
 * @param error - Refresh error or null if successful
 * @param token - New access token or null if refresh failed
 */
function processQueue(error: RefreshError | null, token: string | null = null): void {
  
  
  failedQueue.forEach((callback) => {
    if (error) {
      callback.reject(error);
    } else if (token) {
      callback.resolve(token);
    } else {
      callback.reject(new Error('Queue processing failed: no token or error'));
    }
  });

  failedQueue = [];
}

// Única fuente de verdad: EXPO_PUBLIC_API_URL
const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

// Fallback para Android emulator (10.0.2.2 apunta a localhost del host)
const resolvedBaseUrl = (envApiUrl || 'http://10.0.2.2:8007/api').replace(/\/+$/, '');

if (!envApiUrl) {
  console.warn('[api.ts] Falta EXPO_PUBLIC_API_URL en .env, usando fallback:', resolvedBaseUrl);
}

// Exportar URLs
export const API_BASE_URL = resolvedBaseUrl; // Ej: http://10.146.13.164:8007/api
export const WEBSOCKET_URL = resolvedBaseUrl.replace('/api', ''); // Ej: http://10.146.13.164:8007

export const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos timeout
});

api.interceptors.request.use(
  async (config) => {
    const token = authStore.accessToken;

    if (token) {
      // Check if token is expired and try to refresh
      // But only if we're not already refreshing (prevents circular/infinite refresh attempts)
      if (authStore.isTokenExpired && authStore.hasRefreshToken && !authStore.isRefreshing) {
        
        
        // Import authController dynamically to avoid circular dependency
        const { authController } = await import('@/src/features/auth/controllers/AuthController');
        const refreshSuccess = await authController.refreshTokens();
        
        if (refreshSuccess) {
          // Use the new token
          config.headers.Authorization = `Bearer ${authStore.accessToken}`;
          
        } else {
          // Refresh failed, request will fail with 401
          config.headers.Authorization = `Bearer ${token}`;
          
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
        
      }
    } else {
      console.warn('⚠️ [API Interceptor] No token available for request');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as AxiosRequestConfig & { _retry?: boolean };
    const requestPath = String(error?.config?.url || '');
    const isNotifications404 =
      error?.response?.status === 404 && /\/notifications(\/|$)/.test(requestPath);

    // Log non-404 errors for debugging
    if (error?.response?.status === 404 && !isNotifications404) {
      console.error('API 404', {
        baseURL: error?.config?.baseURL,
        path: error?.config?.url,
        fullUrl: `${error?.config?.baseURL || ''}${error?.config?.url || ''}`,
        response: error?.response?.data,
      });
    }
    
    // ========================================================================
    // FIX-10 REQ-1: Handle 401 Unauthorized with Mutex & Promise Queueing
    // ========================================================================
    if (
      error?.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestPath.includes('/auth/refresh') &&
      !requestPath.includes('/auth/callback')
    ) {
      originalRequest._retry = true;
      const token = authStore.accessToken;
    

      // Check if user was authenticated
      if (token && authStore.hasRefreshToken) {
        // ====================================================================
        // FIX-10 REQ-1a: If NOT currently refreshing, start refresh
        // ====================================================================
        if (!isRefreshing) {
          isRefreshing = true;
          

          try {
            // Import authController dynamically to avoid circular dependency
            const { authController } = await import('@/src/features/auth/controllers/AuthController');
            const refreshResult = await authController.refreshTokens();

            // ================================================================
            // FIX-10 REQ-2c: If refresh successful, process queue
            // ================================================================
            if (refreshResult.success && refreshResult.tokens?.accessToken) {
              const newToken = refreshResult.tokens.accessToken;
              

              // Update original request with new token
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;

              // Process all queued requests
              processQueue(null, newToken);

              // Retry the original request with new token
              return api(originalRequest);
            } else {
              // ================================================================
              // FIX-10 REQ-2c: If refresh failed, graceful degradation
              // ================================================================
              const refreshError: RefreshError = {
                code: refreshResult.errorCode || 'UNKNOWN',
                message: refreshResult.message || 'Token refresh failed',
                statusCode: refreshResult.statusCode,
              };

              console.error('[API Interceptor] ❌ Token refresh failed', refreshError);

              // Process queue with error
              processQueue(refreshError, null);

              // Clear auth state
              authStore.clearAuth();

              return Promise.reject(error);
            }
          } catch (refreshError) {
            // Unexpected error during refresh
            const error_obj: RefreshError = {
              code: 'UNKNOWN',
              message: refreshError instanceof Error ? refreshError.message : 'Token refresh failed',
            };

            console.error('[API Interceptor] ❌ Unexpected error during refresh', refreshError);
            processQueue(error_obj, null);
            authStore.clearAuth();

            return Promise.reject(error);
          } finally {
            isRefreshing = false;
            
          }
        } else {
          // ====================================================================
          // FIX-10 REQ-1b: If already refreshing, queue this request
          // ====================================================================
          

          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: unknown) => {
                // Retry with new token
                if (typeof token === 'string') {
                  originalRequest.headers = originalRequest.headers || {};
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  api(originalRequest).then(resolve).catch(reject);
                } else {
                  reject(new Error('Invalid token received from queue'));
                }
              },
              reject: (error: unknown) => {
                reject(error);
              },
            });
          });
        }
      } else if (token) {
        // User was authenticated but no refresh token available
        console.error('[API Interceptor] ⚠️ Sesión expirada - no refresh token available');
        authStore.clearAuth();
      }
      // If no token, silently reject (first time without login)
    }
    
    return Promise.reject(error);
  }
);