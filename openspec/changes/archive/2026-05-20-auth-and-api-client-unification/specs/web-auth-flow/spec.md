## ADDED Requirements

### Requirement: Web SHALL use @auth0/auth0-spa-js for Auth0 authentication
The web frontend SHALL integrate Auth0 Universal Login using the `@auth0/auth0-spa-js` SDK instead of Expo-specific auth libraries.

#### Scenario: User clicks "Iniciar sesión" on web
- **WHEN** the user clicks the login button on the web LoginScreen
- **THEN** the system SHALL redirect the browser to Auth0 Universal Login
- **AND** SHALL use the same Auth0 tenant and client ID as the mobile app
- **AND** SHALL request the `openid profile email offline_access` scopes

#### Scenario: Auth0 redirects back after successful login
- **WHEN** Auth0 redirects back to the web app with an authorization code
- **THEN** `@auth0/auth0-spa-js` SHALL exchange the code for tokens
- **AND** the `access_token` and user info SHALL be stored in `AuthStore`
- **AND** the user SHALL be redirected to the events page (or onboarding if needed)

#### Scenario: Web token refresh
- **WHEN** the access token expires and a refresh token is available
- **THEN** `@auth0/auth0-spa-js` SHALL attempt silent refresh via iframe
- **AND** if iframe refresh fails (third-party cookies blocked), SHALL fall back to full redirect
- **AND** the new tokens SHALL be persisted to `AuthStore`

### Requirement: Web SHALL remove Expo-specific auth code
The web frontend SHALL NOT import or use Expo-specific packages (`expo-auth-session`, `expo-web-browser`, `expo-constants`) for authentication.

#### Scenario: Dead Expo hook removed
- **WHEN** the web build runs
- **THEN** `Frontend-web/src/features/auth/hooks/useAuth0Login.ts` SHALL NOT exist
- **AND** no imports from `expo-auth-session` or `expo-web-browser` SHALL remain in web auth code

#### Scenario: Controller import resolved
- **WHEN** `useAppInitialization.ts` and `useTokenRefresh.ts` are loaded
- **THEN** they SHALL NOT import from a non-existent `controllers/` directory
- **AND** SHALL import directly from `store/AuthStore` or use inline initialization logic

### Requirement: Web LoginScreen SHALL trigger real Auth0 login
The placeholder `window.alert('Auth0 login flow - To be implemented')` SHALL be replaced with a real login function that calls the Auth0 SDK.

#### Scenario: Login button triggers Auth0 redirect
- **WHEN** the user clicks the login button on LoginScreen
- **THEN** the system SHALL call `auth0Client.loginWithRedirect()`
- **AND** SHALL display loading state while redirecting
