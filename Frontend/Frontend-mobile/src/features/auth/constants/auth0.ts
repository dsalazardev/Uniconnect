export const AUTH0_CONFIG = {
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN,
  clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
  audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
  scopes: ['openid', 'profile', 'email', 'offline_access'], // Es más seguro dejar el scope hardcodeado si no cambia
};