export const AUTH_ENDPOINTS = {
  LOGIN_GOOGLE: '/auth/google',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ALTERNATIVE_LOGIN: '/auth/temp-login',
  AUTH_CALLBACK: '/auth/callback',
  USER_PROFILE: '/users/profile',
  ONBOARDING: '/users/onboarding',
} as const;