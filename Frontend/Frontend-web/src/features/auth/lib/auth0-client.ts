import { createAuth0Client, Auth0Client } from '@auth0/auth0-spa-js';

let auth0Client: Auth0Client | null = null;

const AUTH0_CONFIG = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN ?? '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID ?? '',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE ?? '',
  scope: 'openid profile email offline_access',
  redirectUri: window.location.origin + '/login',
};

export async function getAuth0Client(): Promise<Auth0Client> {
  if (!auth0Client) {
    auth0Client = await createAuth0Client({
      domain: AUTH0_CONFIG.domain,
      clientId: AUTH0_CONFIG.clientId,
      authorizationParams: {
        audience: AUTH0_CONFIG.audience,
        redirect_uri: AUTH0_CONFIG.redirectUri,
        scope: AUTH0_CONFIG.scope,
      },
      cacheLocation: 'localstorage',
    });
  }
  return auth0Client;
}

export function getAuth0Config() {
  return AUTH0_CONFIG;
}
