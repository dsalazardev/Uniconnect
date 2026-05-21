# Capability: safe-push-registration

## Summary

Provide a fail-safe push registration flow for mobile clients so that missing native FCM configuration (e.g., google-services.json) does not crash the app. The flow must be environment-aware and must not throw unhandled exceptions.

## Requirements

1. The app must never crash due to push registration failures on Android or iOS. Any exception during push registration must be caught and handled.
2. Default behavior: attempt to register for push tokens on native devices (non-web) when user is authenticated and device is physical (Device.isDevice === true).
3. If the environment lacks FCM configuration, the registration step should fail gracefully: log a developer-friendly warning and continue app initialization.
4. A feature flag `enablePush` must be respected if present in `Constants.expoConfig.extra.enablePush` (boolean). If set to `false`, the hook must skip registration entirely.
5. When registration fails, the system must not send any token to the backend and must cleanup any partial state.

## Acceptance Criteria

- Given a dev build on Android without google-services.json, when the app starts and code attempts push registration, the app remains functional and logs a warning containing the FCM docs URL.
- Given `enablePush = false`, the app must not attempt permissions nor token retrieval.
- Given a successful registration (FCM configured), the server API is called exactly once with the token payload.

## Implementation Notes

- Primary change point: `src/features/notifications/hooks/useNotifications.ts`.
- Use try/catch around the async flow including getPermissionsAsync, requestPermissionsAsync, getExpoPushTokenAsync.
- Use `__DEV__` to add extra logging during development but do not alter behavior in production.
