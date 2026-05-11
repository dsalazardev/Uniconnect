import { authStore } from '../store/AuthStore';
import { authService } from '../services';
import { showToast } from '@/src/lib/toast';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { AUTH0_CONFIG } from '../constants/auth0';
import { makeRedirectUri } from 'expo-auth-session';
import type { User } from '../types/user.types';

// ============================================================================
// FIX-10: Type Definitions for Token Refresh Result
// ============================================================================

/**
 * Result of token refresh operation
 * Allows interceptor to handle success/failure gracefully without try/catch
 */
export interface TokenRefreshResult {
  success: boolean;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
  };
  errorCode?: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'SERVER_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN';
  message?: string;
  statusCode?: number;
}

interface Auth0Tokens {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
}

interface AuthResponseData {
  access_token: string;
  user: User;
  auth0_tokens?: Auth0Tokens | null;
}

export class AuthController {
  
  async handleAuthorizationCode(authorizationCode: string, redirectUri: string, codeVerifier: string): Promise<void> {
    try {
      authStore.setLoading(true);
      authStore.clearError();

      
      const fenResponse = await authService.exchangeAuthorizationCode(authorizationCode, redirectUri, codeVerifier);

      // Validate FEN response format
      if (!fenResponse.success || fenResponse.statusCode !== 200) {
        
        const errorDetail = fenResponse.message || 'Autenticación fallida';
        
        // Prevents session persistence when domain validation fails
        await this.cleanupAuth0SessionOnError();
        
        authStore.setError(errorDetail);
        
        // No mostrar toast si es un error de red o servidor (silenciar en login)
        if (!errorDetail.toLowerCase().includes('network') && 
            !errorDetail.toLowerCase().includes('econnrefused') &&
            !errorDetail.toLowerCase().includes('timeout')) {
          showToast.error('Error de autenticación', errorDetail);
        }
        return; // No lanzar excepción, solo mostrar el error
      }

      // Extract data from FEN response
      if (!fenResponse.data || typeof fenResponse.data !== 'object') {
        throw new Error('Invalid response format from BFF');
      }

      const responseData = fenResponse.data as AuthResponseData;
      const { access_token, user, auth0_tokens } = responseData;
      
      if (!access_token || !user) {
        console.error('Invalid FEN response - missing access_token or user:', {
          hasAccessToken: !!access_token,
          hasUser: !!user,
        });
        throw new Error('Invalid response format from BFF');
      }

      
      // Update AuthStore with the received data (MVC Local pattern)
      authStore.setAuth(access_token, user, auth0_tokens);

      showToast.success('¡Éxito!', 'Autenticación completada correctamente');

      // Route based on onboarding status from the backend
      if (user.needsOnboarding) {
        
        router.replace('/(auth)/onboarding');
      } else {
        
        router.replace('/(tabs)');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en la autenticación';
      authStore.setError(errorMessage);
      
      // No mostrar toast si es error de red en login
      if (!errorMessage.toLowerCase().includes('network') && 
          !errorMessage.toLowerCase().includes('econnrefused') &&
          !errorMessage.toLowerCase().includes('timeout')) {
        showToast.error('Error', errorMessage);
      }
    } finally {
      authStore.setLoading(false);
    }
  }

  async logout(): Promise<void> {
    try {
      authStore.setLoading(true);
      
      // 1. Call backend to invalidate tokens (if we have an access token)
      if (authStore.accessToken) {
        try {
          
          await authService.logout(authStore.accessToken);
          
        } catch (backendError) {
          // Log but don't fail - continue with local cleanup
          console.error('Backend logout failed, continuing with local cleanup:', backendError);
        }
      }

      // 2. Clear local authentication state
      authStore.clearAuth();

      // 3. Close Auth0 session on their servers to allow account switching
      try {
        const redirectUri = makeRedirectUri({
          scheme: 'uniconnect',
          path: 'login',
        });
        
        const logoutUrl = `https://${AUTH0_CONFIG.domain}/v2/logout?client_id=${AUTH0_CONFIG.clientId}&returnTo=${encodeURIComponent(redirectUri)}`;
        
        // Open Auth0 logout URL silently (clears Auth0 session cookies without popup)
        await fetch(logoutUrl, { method: 'GET', mode: 'no-cors' }).catch(() => {});
        
        
      } catch (auth0Error) {
        // Log but don't fail if Auth0 logout has issues
        
      }

      // 4. Show success message
      showToast.success('Sesión cerrada', 'Has cerrado sesión correctamente');
      
      // 5. Wait a moment to ensure state is cleared before navigation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 6. Navigate to login screen
      router.replace('/(auth)/login');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cerrar sesión';
      authStore.setError(errorMessage);
      showToast.error('Error', errorMessage);
      
      // Even on error, try to navigate to login
      try {
        router.replace('/(auth)/login');
      } catch (navError) {
        console.error('Navigation error during logout:', navError);
      }
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * FIX-10: Refresh tokens with robust error handling
   * 
   * Returns a typed result object instead of throwing exceptions.
   * This allows the interceptor to handle failures gracefully without try/catch.
   * 
   * Behavior:
   * - If successful: Returns { success: true, tokens: {...} }
   * - If failed: Returns { success: false, errorCode: '...', message: '...' }
   * - Never throws exceptions during refresh failure
   */
  async refreshTokens(): Promise<TokenRefreshResult> {
    try {
      // Check if already refreshing to prevent simultaneous refresh attempts
      if (authStore.isRefreshing) {
        
        return {
          success: false,
          errorCode: 'UNKNOWN',
          message: 'Already refreshing tokens',
        };
      }

      // Check if we have a refresh token
      if (!authStore.hasRefreshToken || !authStore.auth0Tokens?.refresh_token || !authStore.user?.id_user) {
        console.error('Cannot refresh tokens - missing data:', {
          hasRefreshToken: authStore.hasRefreshToken,
          hasAuth0Tokens: !!authStore.auth0Tokens,
          hasRefreshTokenValue: !!authStore.auth0Tokens?.refresh_token,
          hasUserId: !!authStore.user?.id_user,
        });
        return {
          success: false,
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Missing refresh token or user ID',
        };
      }

      
      authStore.isRefreshing = true;
      authStore.setLoading(true);
      authStore.clearError();

      // Call BFF to refresh tokens
      const fenResponse = await authService.refreshTokens(
        authStore.auth0Tokens.refresh_token,
        authStore.user.id_user
      );

      // Validate FEN response format
      if (!fenResponse.success || fenResponse.statusCode !== 200) {
        const message = fenResponse.message || 'Token refresh failed';
        console.error('Refresh failed with response error:', {
          success: fenResponse.success,
          statusCode: fenResponse.statusCode,
          message,
        });

        // FIX-10 REQ-2c: Don't show toast during interceptor-driven refresh
        // The interceptor will handle user notification
        
        // Clear auth state on refresh failure (graceful degradation)
        authStore.clearAuth();
        
        return {
          success: false,
          errorCode: this.getErrorCodeFromStatus(fenResponse.statusCode),
          message,
          statusCode: fenResponse.statusCode,
        };
      }

      // Extract data from FEN response
      if (!fenResponse.data || typeof fenResponse.data !== 'object') {
        authStore.clearAuth();
        return {
          success: false,
          errorCode: 'UNKNOWN',
          message: 'Invalid refresh response format',
        };
      }

      const responseData = fenResponse.data as AuthResponseData;
      const { access_token, user, auth0_tokens } = responseData;
      
      if (!access_token || !user) {
        console.error('Invalid refresh response format from BFF');
        
        // Clear auth state on invalid response
        authStore.clearAuth();
        
        return {
          success: false,
          errorCode: 'UNKNOWN',
          message: 'Invalid refresh response format',
        };
      }

      // Update AuthStore with new tokens
      authStore.setAuth(access_token, user, auth0_tokens);
      
      
      
      return {
        success: true,
        tokens: {
          accessToken: access_token,
          refreshToken: auth0_tokens?.refresh_token,
        },
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during token refresh';
      console.error('Unexpected error during token refresh:', error);
      
      // FIX-10 REQ-2: Graceful degradation - don't throw, just return error result
      authStore.clearAuth();
      
      return {
        success: false,
        errorCode: this.getErrorCodeFromException(error),
        message: errorMessage,
      };
    } finally {
      authStore.isRefreshing = false;
      authStore.setLoading(false);
    }
  }

  /**
   * Map HTTP status codes to error codes
   * @private
   */
  private getErrorCodeFromStatus(status?: number): TokenRefreshResult['errorCode'] {
    if (!status) return 'UNKNOWN';
    
    if (status === 400) return 'INVALID_CREDENTIALS';
    if (status === 401) return 'TOKEN_EXPIRED';
    if (status === 408) return 'TIMEOUT';
    if (status === 429) return 'UNKNOWN'; // Will be handled as rate limit
    if (status >= 500) return 'SERVER_ERROR';
    
    return 'UNKNOWN';
  }

  /**
   * Map exceptions to error codes
   * @private
   */
  private getErrorCodeFromException(error: unknown): TokenRefreshResult['errorCode'] {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('timeout')) return 'TIMEOUT';
      if (message.includes('network')) return 'NETWORK_ERROR';
    }
    return 'UNKNOWN';
  }

  async ensureValidTokens(): Promise<boolean> {
    // If not authenticated, no need to refresh
    if (!authStore.isAuthenticated) {
      return false;
    }

    // If token is not expired, no need to refresh
    if (!authStore.isTokenExpired) {
      return true;
    }

    // Token is expired, try to refresh
    
    const result = await this.refreshTokens();
    return result.success;
  }

  private async cleanupAuth0SessionOnError(): Promise<void> {
    try {
      const redirectUri = makeRedirectUri({
        scheme: 'uniconnect',
        path: 'login',
      });
      
      const logoutUrl = `https://${AUTH0_CONFIG.domain}/v2/logout?client_id=${AUTH0_CONFIG.clientId}&returnTo=${encodeURIComponent(redirectUri)}`;
            // Silent fetch to logout from Auth0 (clears session cookies)
      await fetch(logoutUrl, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      
      console.log('[Auth] Auth0 session cleared on auth failure (invalid domain)');
    } catch (error) {
      console.error('[Auth] Failed to cleanup Auth0 session on error:', error);
      // Continue anyway - local cleanup is prioritized
    }
  }

  async initializeAuth(): Promise<void> {
    
    
    // Wait for AuthStore to initialize from storage with timeout
    const maxWaitTime = 5000; // 5 seconds timeout
    const startTime = Date.now();
    
    while (!authStore.isInitialized) {
      if (Date.now() - startTime > maxWaitTime) {
        console.error('❌ [initializeAuth] Timeout waiting for AuthStore initialization');
        // Force initialization to prevent infinite loop
        authStore.isInitialized = true;
        authStore.clearAuth();
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    

    // If we have a stored session, validate it
    if (authStore.isAuthenticated) {
      
      
      // Check if we need to refresh tokens
      if (authStore.isTokenExpired && authStore.hasRefreshToken) {
        
        const result = await this.refreshTokens();
        
        if (!result.success) {
          
          authStore.clearAuth();
          return;
        }
        
        
      } else if (authStore.isTokenExpired && !authStore.hasRefreshToken) {
        
        authStore.clearAuth();
        return;
      } else {
        
      }

      // Fetch fresh profile to get up-to-date needsOnboarding status
      if (authStore.isAuthenticated) {
        try {
          
          const profile = await authService.getUserProfile();
          authStore.setNeedsOnboarding(profile.needsOnboarding ?? false);
          
        } catch (error) {
          console.warn('⚠️ [initializeAuth] Failed to fetch profile, using cached needsOnboarding');
          // Use persisted needsOnboarding — don't fail initialization
        }
      }
    } else {
      
    }
    
    
  }

  async completeOnboarding(id_program: number, current_semester: number): Promise<void> {
    try {
      authStore.setLoading(true);
      authStore.clearError();
      await authService.completeOnboarding(id_program, current_semester);
      authStore.setNeedsOnboarding(false);
      showToast.success('¡Listo!', 'Perfil académico guardado correctamente');
      router.replace('/(tabs)');
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 400) {
        const msg = error?.response?.data?.message || 'Verifica los datos ingresados.';
        authStore.setError(msg);
        throw error;
      } else if (status === 404) {
        authStore.setError('Programa no válido, selecciona otro.');
        throw error;
      } else if (status === 409) {
        // Already completed — treat as success
        authStore.setNeedsOnboarding(false);
        router.replace('/(tabs)');
      } else if (status === 401) {
        authStore.clearAuth();
        router.replace('/(auth)/login');
      } else {
        const msg = error instanceof Error ? error.message : 'Error al guardar el perfil';
        authStore.setError(msg);
        showToast.error('Error', msg);
        throw error;
      }
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * Get current authentication status
   */
  get isAuthenticated(): boolean {
    return authStore.isAuthenticated;
  }

  /**
   * Get current user data
   */
  get currentUser() {
    return authStore.user;
  }

  /**
   * Get current error message
   */
  get error() {
    return authStore.error;
  }
}

// Singleton instance for dependency injection (Kiro Pattern)
export const authController = new AuthController();