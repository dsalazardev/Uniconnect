/**
 * Axios Factory with Dependency Injection
 * 
 * Creates configured Axios instances with:
 * - Token refresh mutex pattern (FIX-10)
 * - FEN response validation interceptor
 * - Automatic Bearer token injection
 * 
 * This factory is platform-agnostic and uses dependency injection
 * to avoid coupling with specific auth stores or controllers.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { FENResponse } from '../types/common';

// ============================================================================
// Type Definitions for Token Refresh with Mutex & Promise Queueing (FIX-10)
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
export interface RefreshError {
  code: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'SERVER_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  statusCode?: number;
}

/**
 * Token refresh result from auth controller
 */
export interface TokenRefreshResult {
  success: boolean;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
  };
  errorCode?: RefreshError['code'];
  message?: string;
  statusCode?: number;
}

/**
 * Auth provider interface for dependency injection
 * Implementations must provide these methods for token management
 */
export interface AuthProvider {
  /**
   * Get current access token
   */
  getAccessToken: () => string | null;
  
  /**
   * Check if current token is expired
   */
  isTokenExpired: () => boolean;
  
  /**
   * Check if refresh token is available
   */
  hasRefreshToken: () => boolean;
  
  /**
   * Check if token refresh is currently in progress
   */
  isRefreshing: () => boolean;
  
  /**
   * Refresh tokens and return result
   */
  refreshTokens: () => Promise<TokenRefreshResult>;
  
  /**
   * Clear authentication state (logout)
   */
  clearAuth: () => void;
}

/**
 * Configuration options for createApiClient factory
 */
export interface ApiClientConfig {
  /**
   * Base URL for API requests (e.g., 'http://localhost:8007/api')
   */
  baseURL: string;
  
  /**
   * Auth provider for token management (dependency injection)
   */
  authProvider: AuthProvider;
  
  /**
   * Request timeout in milliseconds (default: 10000)
   */
  timeout?: number;
  
  /**
   * Enable FEN response validation interceptor (default: true)
   */
  enableFENValidation?: boolean;
  
  /**
   * Enable debug logging (default: false)
   */
  debug?: boolean;
}

// ============================================================================
// Global State for Mutex & Promise Queueing (FIX-10 REQ-1)
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

/**
 * Validate FEN response structure
 * 
 * @param data - Response data to validate
 * @returns true if valid FEN response, false otherwise
 */
function isValidFENResponse(data: unknown): data is FENResponse<unknown> {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const response = data as Record<string, unknown>;

  // Check required fields
  if (typeof response.success !== 'boolean') {
    return false;
  }

  // data can be null or any type
  if (!('data' in response)) {
    return false;
  }

  // error must be null or an object with code and message
  if (response.error !== null) {
    if (typeof response.error !== 'object') {
      return false;
    }
    const error = response.error as Record<string, unknown>;
    if (typeof error.code !== 'string' || typeof error.message !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Create configured Axios instance with interceptors
 * 
 * This factory function creates an Axios instance with:
 * - Automatic Bearer token injection
 * - Token refresh mutex pattern (FIX-10)
 * - FEN response validation
 * - 401 retry logic with queue
 * 
 * @param config - Configuration options
 * @returns Configured Axios instance
 * 
 * @example
 * ```typescript
 * const authProvider: AuthProvider = {
 *   getAccessToken: () => authStore.accessToken,
 *   isTokenExpired: () => authStore.isTokenExpired,
 *   hasRefreshToken: () => authStore.hasRefreshToken,
 *   isRefreshing: () => authStore.isRefreshing,
 *   refreshTokens: () => authController.refreshTokens(),
 *   clearAuth: () => authStore.clearAuth(),
 * };
 * 
 * const api = createApiClient({
 *   baseURL: 'http://localhost:8007/api',
 *   authProvider,
 *   timeout: 10000,
 *   enableFENValidation: true,
 *   debug: false,
 * });
 * ```
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const {
    baseURL,
    authProvider,
    timeout = 10000,
    enableFENValidation = true,
    debug = false,
  } = config;

  // Create Axios instance
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  });

  // ============================================================================
  // Request Interceptor: Inject Bearer Token
  // ============================================================================
  client.interceptors.request.use(
    async (requestConfig) => {
      const token = authProvider.getAccessToken();

      if (token) {
        // Check if token is expired and try to refresh
        // But only if we're not already refreshing (prevents circular/infinite refresh attempts)
        if (
          authProvider.isTokenExpired() &&
          authProvider.hasRefreshToken() &&
          !authProvider.isRefreshing()
        ) {
          if (debug) {
            console.log('[API Client] Token expired, refreshing before request');
          }

          const refreshResult = await authProvider.refreshTokens();

          if (refreshResult.success && refreshResult.tokens?.accessToken) {
            // Use the new token
            requestConfig.headers.Authorization = `Bearer ${refreshResult.tokens.accessToken}`;
            if (debug) {
              console.log('[API Client] Token refreshed successfully');
            }
          } else {
            // Refresh failed, request will fail with 401
            requestConfig.headers.Authorization = `Bearer ${token}`;
            if (debug) {
              console.warn('[API Client] Token refresh failed, using expired token');
            }
          }
        } else {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }
      } else if (debug) {
        console.warn('[API Client] No token available for request');
      }

      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // ============================================================================
  // Response Interceptor: FEN Validation + 401 Retry with Mutex
  // ============================================================================
  client.interceptors.response.use(
    (response) => {
      // Validate FEN response structure if enabled
      if (enableFENValidation && response.data) {
        if (!isValidFENResponse(response.data)) {
          console.error('[API Client] Invalid FEN response structure:', response.data);
          // Don't throw error, just log warning - let services handle validation
        }
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error?.config as AxiosRequestConfig & { _retry?: boolean };
      const requestPath = String(error?.config?.url || '');
      const isNotifications404 =
        error?.response?.status === 404 && /\/notifications(\/|$)/.test(requestPath);

      // Log non-404 errors for debugging
      if (error?.response?.status === 404 && !isNotifications404 && debug) {
        console.error('[API Client] 404 Error', {
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
        const token = authProvider.getAccessToken();

        if (debug) {
          console.log('[API Client] 401 Unauthorized, attempting token refresh');
        }

        // Check if user was authenticated
        if (token && authProvider.hasRefreshToken()) {
          // ====================================================================
          // FIX-10 REQ-1a: If NOT currently refreshing, start refresh
          // ====================================================================
          if (!isRefreshing) {
            isRefreshing = true;

            if (debug) {
              console.log('[API Client] Starting token refresh (mutex acquired)');
            }

            try {
              const refreshResult = await authProvider.refreshTokens();

              // ================================================================
              // FIX-10 REQ-2c: If refresh successful, process queue
              // ================================================================
              if (refreshResult.success && refreshResult.tokens?.accessToken) {
                const newToken = refreshResult.tokens.accessToken;

                if (debug) {
                  console.log('[API Client] Token refresh successful, processing queue');
                }

                // Update original request with new token
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Process all queued requests
                processQueue(null, newToken);

                // Retry the original request with new token
                return client(originalRequest);
              } else {
                // ================================================================
                // FIX-10 REQ-2c: If refresh failed, graceful degradation
                // ================================================================
                const refreshError: RefreshError = {
                  code: refreshResult.errorCode || 'UNKNOWN',
                  message: refreshResult.message || 'Token refresh failed',
                  statusCode: refreshResult.statusCode,
                };

                console.error('[API Client] Token refresh failed', refreshError);

                // Process queue with error
                processQueue(refreshError, null);

                // Clear auth state
                authProvider.clearAuth();

                return Promise.reject(error);
              }
            } catch (refreshError) {
              // Unexpected error during refresh
              const errorObj: RefreshError = {
                code: 'UNKNOWN',
                message: refreshError instanceof Error ? refreshError.message : 'Token refresh failed',
              };

              console.error('[API Client] Unexpected error during refresh', refreshError);
              processQueue(errorObj, null);
              authProvider.clearAuth();

              return Promise.reject(error);
            } finally {
              isRefreshing = false;
              if (debug) {
                console.log('[API Client] Token refresh complete (mutex released)');
              }
            }
          } else {
            // ====================================================================
            // FIX-10 REQ-1b: If already refreshing, queue this request
            // ====================================================================
            if (debug) {
              console.log('[API Client] Token refresh in progress, queueing request');
            }

            return new Promise((resolve, reject) => {
              failedQueue.push({
                resolve: (token: unknown) => {
                  // Retry with new token
                  if (typeof token === 'string') {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    client(originalRequest).then(resolve).catch(reject);
                  } else {
                    reject(new Error('Invalid token received from queue'));
                  }
                },
                reject: (queueError: unknown) => {
                  reject(queueError);
                },
              });
            });
          }
        } else if (token) {
          // User was authenticated but no refresh token available
          console.error('[API Client] Session expired - no refresh token available');
          authProvider.clearAuth();
        }
        // If no token, silently reject (first time without login)
      }

      return Promise.reject(error);
    }
  );

  return client;
}
