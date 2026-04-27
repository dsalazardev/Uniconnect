import { api } from '@/src/constants/api';
import { AUTH_ENDPOINTS } from '../api/endpoints';

export const authService = {
  
  exchangeAuthorizationCode: async (code: string, redirectUri: string, codeVerifier: string) => {
    try {
      const response = await api.post('/auth/callback', {
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier, // PKCE: Send code_verifier for secure exchange
      });
      
      // Retornamos la respuesta (que viene envuelta en formato FEN desde el backend)
      return response.data;
    } catch (error: any) {
      // Extraer el mensaje de error del backend
      const errorMessage = error?.response?.data?.message || error?.message || 'Authentication failed';
      console.error('Auth service error:', errorMessage);
      
      // Retornar error en formato FEN para mantener consistencia
      return {
        success: false,
        statusCode: error?.response?.status || 500,
        message: errorMessage,
        data: null,
      };
    }
  },

  refreshTokens: async (refreshToken: string, userId: number) => {
    try {
      console.log('[AuthService] Calling /auth/refresh endpoint');

      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken,
        user_id: userId,
      });
      
      console.log('[AuthService] Refresh response received:', {
        success: response.data?.success,
        statusCode: response.data?.statusCode,
        hasAccessToken: !!response.data?.data?.access_token,
        hasRefreshToken: !!response.data?.data?.auth0_tokens?.refresh_token,
      });
      
      return response.data;
      
    } catch (error: unknown) {
      // FIX-10 REQ-2: Handle errors gracefully without throwing
      // The error response will be wrapped in FEN format for consistency
      
      let statusCode = 500;
      let errorMessage = 'Token refresh failed';

      if (error instanceof Error && 'response' in error) {
        const axiosError = error as Record<string, any>;
        statusCode = axiosError.response?.status || 500;
        errorMessage = axiosError.response?.data?.message || axiosError.message || 'Token refresh failed';
        
        console.error('[AuthService] Refresh token service error:', {
          status: statusCode,
          message: errorMessage,
          data: axiosError.response?.data,
        });
      } else {
        console.error('[AuthService] Unexpected error during refresh:', error);
        errorMessage = error instanceof Error ? error.message : 'Unexpected error during refresh';
      }
      
      // FIX-10: Return error in FEN format for consistency
      // Never throw - let the caller decide what to do with the error
      return {
        success: false,
        statusCode,
        message: errorMessage,
        data: null,
      };
    }
  },

  /**
   * Logout from Auth0 and invalidate tokens
   * Foundation for logout flow
   */
  async logout(accessToken: string) {
    const { data } = await api.post('/auth/logout', {
      access_token: accessToken,
    });
    
    return data;
  },

  // Utility function preserved for image handling
  getImageUri: (
    image: string | null | undefined,
  ): string | undefined => {
    if (!image) return undefined;

    if (image.startsWith("data:image")) {
      return image;
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `data:image/jpeg;base64,${image}`;
  },

  getUserProfile: async (): Promise<{
    id: number;
    full_name: string;
    email: string;
    picture?: string;
    needsOnboarding: boolean;
    [key: string]: any;
  }> => {
    const { data } = await api.get(AUTH_ENDPOINTS.USER_PROFILE);
    return data;
  },

  completeOnboarding: async (id_program: number, current_semester: number): Promise<void> => {
    await api.post(AUTH_ENDPOINTS.ONBOARDING, { id_program, current_semester });
  },
};