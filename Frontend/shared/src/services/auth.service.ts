/**
 * AuthService - BFF (Backend for Frontend) layer with Dependency Injection
 * 
 * Handles HTTP communication with the backend API for authentication.
 * Uses injected Axios instance for platform-agnostic HTTP calls.
 */

import type { AxiosInstance } from 'axios';
import { AUTH_ENDPOINTS } from '../api/endpoints';

export class AuthService {
  private readonly api: AxiosInstance;

  /**
   * Constructor with Dependency Injection
   * @param axiosInstance - Configured Axios instance (injected)
   */
  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeAuthorizationCode(
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: unknown;
  }> {
    try {
      const response = await this.api.post('/auth/callback', {
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      });

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message || 'Authentication failed';
      console.error('Auth service error:', errorMessage);

      return {
        success: false,
        statusCode: axiosError.response?.status || 500,
        message: errorMessage,
        data: null,
      };
    }
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(
    refreshToken: string,
    userId: number
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: unknown;
  }> {
    try {
      const response = await this.api.post('/auth/refresh', {
        refresh_token: refreshToken,
        user_id: userId,
      });

      return response.data;
    } catch (error: unknown) {
      let statusCode = 500;
      let errorMessage = 'Token refresh failed';

      if (error instanceof Error && 'response' in error) {
        const axiosError = error as Record<string, unknown>;
        const response = axiosError.response as { status?: number; data?: { message?: string } };
        statusCode = response?.status || 500;
        errorMessage = response?.data?.message || (error as Error).message || 'Token refresh failed';

        console.error('[AuthService] Refresh token service error:', {
          status: statusCode,
          message: errorMessage,
          data: response?.data,
        });
      } else {
        console.error('[AuthService] Unexpected error during refresh:', error);
        errorMessage = error instanceof Error ? error.message : 'Unexpected error during refresh';
      }

      return {
        success: false,
        statusCode,
        message: errorMessage,
        data: null,
      };
    }
  }

  /**
   * Logout from Auth0 and invalidate tokens
   */
  async logout(accessToken: string): Promise<unknown> {
    const { data } = await this.api.post('/auth/logout', {
      access_token: accessToken,
    });

    return data;
  }

  /**
   * Utility function for image handling
   */
  getImageUri(image: string | null | undefined): string | undefined {
    if (!image) return undefined;

    if (image.startsWith('data:image')) {
      return image;
    }

    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }

    return `data:image/jpeg;base64,${image}`;
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<{
    id: number;
    full_name: string;
    email: string;
    picture?: string;
    needsOnboarding: boolean;
    [key: string]: unknown;
  }> {
    const { data } = await this.api.get(AUTH_ENDPOINTS.USER_PROFILE);
    return data;
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(id_program: number, current_semester: number): Promise<void> {
    await this.api.post(AUTH_ENDPOINTS.ONBOARDING, { id_program, current_semester });
  }
}
