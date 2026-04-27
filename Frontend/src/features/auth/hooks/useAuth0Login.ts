import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { AUTH0_CONFIG } from '../constants/auth0';
import { authStore } from '../store/AuthStore';
import { authController } from '../controllers/AuthController';
import { showToast } from '@/src/lib/toast';
import { generatePKCEPair } from '../utils/pkce';

// Complete the auth session for web browsers
WebBrowser.maybeCompleteAuthSession();

export function useAuth0Login() {
  const [pkce, setPkce] = useState<{ codeVerifier: string; codeChallenge: string } | null>(null);

  // Solo Expo Go usa appOwnership === 'expo' o 'guest'.
  // Dev client y builds nativas usan el scheme propio (uniconnect://).
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.appOwnership === 'guest';

  const appOwner = Constants.expoConfig?.owner;
  const appSlug = Constants.expoConfig?.slug;
  const projectFullName = appOwner && appSlug ? `@${appOwner}/${appSlug}` : null;

  const nativeReturnUrl = makeRedirectUri({
    scheme: 'uniconnect', 
    path: 'login',
  });

  const expoProxyRedirectUri = projectFullName
    ? `https://auth.expo.io/${projectFullName}`
    : null;

  const redirectUri = isExpoGo && expoProxyRedirectUri ? expoProxyRedirectUri : nativeReturnUrl;

  console.log('\n======================================================');
  console.log('URL DEFINITIVA (LÓGICA YANET PROFE POSDATA: GRACIAS):');
  console.log(redirectUri);
  console.log('======================================================\n');

  // Generate PKCE pair on mount
  useEffect(() => {
    const initializePKCE = async () => {
      const pkceData = await generatePKCEPair();
      setPkce(pkceData);
      console.log('PKCE pair generated for Auth0 authorization');
    };
    initializePKCE();
  }, []);

  // Configure Auth0 authorization request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: AUTH0_CONFIG.clientId,
      scopes: AUTH0_CONFIG.scopes,
      responseType: 'code', // Authorization Code flow
      redirectUri,
      extraParams: pkce
        ? {
            audience: AUTH0_CONFIG.audience,
            code_challenge: pkce.codeChallenge,
            code_challenge_method: 'S256',
            prompt: 'login', // Force login screen, allows changing account
          }
        : {
            audience: AUTH0_CONFIG.audience,
            prompt: 'login',
          },
    },
    {
      authorizationEndpoint: `https://${AUTH0_CONFIG.domain}/authorize`,
    }
  );

  // Handle the authentication response
  useEffect(() => {
    if (!response) return;

    console.log('useAuth0Login: Response received', {
      type: response.type,
      params: response.type === 'success' || response.type === 'error' ? response.params : undefined,
      redirectUri,
    });

    try {
      if (response.type === 'success') {
        const { code } = response.params;

        console.log('Authorization code received:', code);

        if (code && pkce?.codeVerifier) {
          console.log('Sending code and code_verifier to AuthController...');
          // handleAuthorizationCode gestiona setLoading(false) internamente
          authController.handleAuthorizationCode(code, redirectUri, pkce.codeVerifier);
        } else {
          // Parámetros incompletos — no es un éxito real, detener carga
          const missingItems: string[] = [];
          if (!code) missingItems.push('code');
          if (!pkce?.codeVerifier) missingItems.push('code_verifier');
          console.log('Missing required parameters:', missingItems);
          authStore.setError(`Missing required parameters: ${missingItems.join(', ')}`);
          authStore.setLoading(false); // BUG FIX: faltaba esta llamada
        }

      } else if (response.type === 'error') {
        const errorCode = response.params?.error;
        const errorMessage =
          response.params?.error_description ||
          response.params?.error ||
          'Error en la autenticación';

        console.log('Auth0 Error:', {
          error: response.params?.error,
          error_description: response.params?.error_description,
        });

        if (errorCode === 'access_denied') {
          // El usuario rechazó los permisos — acción voluntaria, sin toast
          console.log('User declined authorization');
          authStore.clearError();
          authStore.setLoading(false);
        } else {
          // Error técnico real
          authStore.setError(errorMessage);
          authStore.setLoading(false);
          showToast.error('Error de Auth0', errorMessage);
        }

      } else if (response.type === 'cancel' || response.type === 'dismiss') {
        // BUG FIX: 'dismiss' ocurre en Android (botón atrás) y en web (cerrar popup)
        console.log(`User ${response.type}ed authentication`);
        authStore.clearError();
        authStore.setLoading(false);
      }
    } catch (error) {
      // Garantía final: cualquier excepción inesperada no deja el botón colgado
      console.error('useAuth0Login: Unexpected error handling response:', error);
      authStore.setLoading(false);
    }
  }, [response, redirectUri, pkce?.codeVerifier]);

  // Function to logout and clear Auth0 session
  const logoutFromAuth0 = async () => {
    try {
      // Close Auth0 session on their servers
      const logoutUrl = `https://${AUTH0_CONFIG.domain}/v2/logout?client_id=${AUTH0_CONFIG.clientId}&returnTo=${encodeURIComponent(redirectUri)}`;
      
      // Open the logout URL in a browser
      await WebBrowser.openBrowserAsync(logoutUrl);
      
      console.log('Auth0 logout initiated');
    } catch (error) {
      console.error('Error during Auth0 logout:', error);
      // Continue with local logout even if Auth0 logout fails
    }
  };

  // Function to switch account by clearing Auth0 session and restarting login
  const switchAccount = async () => {
    try {
      authStore.setLoading(true);
      authStore.clearError();
      
      // Clear Auth0 session and redirect to login screen
      const logoutUrl = `https://${AUTH0_CONFIG.domain}/v2/logout?client_id=${AUTH0_CONFIG.clientId}&returnTo=${encodeURIComponent(redirectUri)}`;
      
      // Open logout URL to clear cookies
      await WebBrowser.openBrowserAsync(logoutUrl);
      
      // After logout, open login with fresh session
      setTimeout(() => {
        promptAsync();
      }, 500);
    } catch (error) {
      console.error('Error switching account:', error);
      authStore.setLoading(false);
    }
  };

  // Return the prompt function and loading state
  return {
    promptAsync: () => {
      try {
        authStore.setLoading(true);
        authStore.clearError();
        promptAsync();
      } catch (error) {
        console.error('useAuth0Login: Failed to launch promptAsync:', error);
        authStore.setLoading(false);
      }
    },
    switchAccount,
    logoutFromAuth0,
    isLoading: authStore.isLoading,
    isReady: !!request && !!pkce,
  };
}