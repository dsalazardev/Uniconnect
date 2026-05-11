import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth0Config } from '../lib/auth0-client';
import { authService } from '../services';
import { authStore } from '../store/AuthStore';

/**
 * Extracts the authorization code from the URL search params.
 */
function extractCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
}

/**
 * Cleans Auth0 redirect params from the URL after processing them.
 * Prevents re-processing on re-render.
 */
function cleanUrlParams(): void {
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}

/**
 * Generates a cryptographically random string for PKCE code_verifier.
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a random state string for CSRF protection.
 */
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Derives a PKCE code_challenge (S256) from a code_verifier using Web Crypto API.
 * Base64url-encoded SHA-256 hash of the verifier.
 */
async function deriveCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function useWebAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isExchanging = useRef(false);

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        const authCode = extractCodeFromUrl();

        if (authCode) {
          if (isExchanging.current) {
            console.warn('[Auth] Exchange already in progress by first cycle — second cycle skipped');
            return;
          }

          const returnedState = new URLSearchParams(window.location.search).get('state');
          const storedState = sessionStorage.getItem('auth_state');

          if (returnedState && storedState && storedState !== returnedState) {
            console.warn('[Auth] CSRF state mismatch - stale redirect params, clearing URL');
            cleanUrlParams();
            return;
          }

          const redirectUri = window.location.origin + '/login';
          const codeVerifier = sessionStorage.getItem('auth_code_verifier') || '';

          isExchanging.current = true;

          console.log("DEBUG LOGIN - Code from URL:", authCode);
          console.log("DEBUG LOGIN - Verifier from sessionStorage:", codeVerifier);
          console.log("DEBUG LOGIN - All sessionStorage Keys:", Object.keys(sessionStorage));

          sessionStorage.removeItem('auth_code_verifier');
          sessionStorage.removeItem('auth_state');

          const fenResponse = await authService.exchangeAuthorizationCode(authCode, redirectUri, codeVerifier);

          if (fenResponse.success && fenResponse.data) {
            const { access_token, user, auth0_tokens } = fenResponse.data as any;
            authStore.setAuth(access_token, user, auth0_tokens);
            cleanUrlParams();

            // Derive from actual fields — show onboarding only when BOTH are null
            const needsOnboarding = user.id_program == null && user.current_semester == null;
            if (needsOnboarding) {
              navigate('/onboarding', { replace: true });
            } else {
              navigate('/events', { replace: true });
            }
            // Note: intentionally NOT setting isLoading(false) here
            // The spinner should remain visible until navigation completes
            return;
          }

          setError(fenResponse.message || 'Error de autenticación');
          cleanUrlParams();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error en autenticación';
        console.error('Auth callback error:', err);
        setError(message);
        cleanUrlParams();
      } finally {
        isExchanging.current = false;
        // Only reset loading on error paths; success path keeps spinner until navigation
        const authCodeAfter = extractCodeFromUrl();
        if (!authCodeAfter) {
          setIsLoading(false);
        }
      }
    };

    const authCode = extractCodeFromUrl();

    if (authCode) {
      handleAuthRedirect();
    } else if (!authStore.isInitialized) {
      const timer = setTimeout(() => {
        if (!authStore.isAuthenticated) {
          setIsLoading(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else if (!authStore.isAuthenticated) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [navigate]);

  const loginWithAuth0 = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const codeVerifier = generateCodeVerifier();
      const state = generateState();
      const codeChallenge = await deriveCodeChallenge(codeVerifier);
      const redirectUri = window.location.origin + '/login';

      sessionStorage.setItem('auth_code_verifier', codeVerifier);
      sessionStorage.setItem('auth_state', state);

      const config = getAuth0Config();
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: redirectUri,
        scope: config.scope,
        audience: config.audience,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'login',
      });

      window.location.assign(`https://${config.domain}/authorize?${params.toString()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authStore.clearAuth();
    const config = getAuth0Config();
    const returnTo = encodeURIComponent(window.location.origin + '/login');
    // Redirect directly to Auth0's logout endpoint to clear the SSO session cookie.
    // Using the SDK's auth0.logout() is unreliable here because login was done via
    // a manual PKCE flow, not through the SDK, so the SDK has no tokens cached.
    window.location.assign(
      `https://${config.domain}/v2/logout?client_id=${config.clientId}&returnTo=${returnTo}`
    );
  }, []);

  return {
    isLoading,
    error,
    loginWithAuth0,
    logout,
    isAuthenticated: authStore.isAuthenticated,
  };
}
