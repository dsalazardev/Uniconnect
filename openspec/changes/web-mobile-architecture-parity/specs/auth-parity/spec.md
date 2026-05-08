## ADDED Requirements

### Requirement: Auth refresh token implementation
The web auth provider SHALL call `AuthService.refreshTokens()` when the access token expires, instead of throwing an error.

#### Scenario: Successful token refresh
- **WHEN** the access token expires and `authProvider.refreshTokens()` is called
- **THEN** the system SHALL call `POST /auth/refresh` with the stored refresh token
- **THEN** the system SHALL update `authStore` with the new access token and user data
- **THEN** the system SHALL return `{ success: true, tokens: { accessToken } }`

#### Scenario: Token refresh failure
- **WHEN** `AuthService.refreshTokens()` returns a non-success response
- **THEN** the system SHALL call `authStore.clearAuth()`
- **THEN** the system SHALL NOT throw an exception
- **THEN** the system SHALL return `{ success: false, errorCode, message }`

### Requirement: PKCE code_verifier generation
The web login flow SHALL generate a cryptographically random PKCE code_verifier and persist it across the redirect.

#### Scenario: Login with PKCE
- **WHEN** `loginWithAuth0()` is called
- **THEN** the system SHALL generate a 43-character code verifier using `crypto.getRandomValues()`
- **THEN** the system SHALL store it in `sessionStorage` under key `auth_code_verifier`
- **THEN** the system SHALL call `auth0.loginWithRedirect()`

#### Scenario: Token exchange with stored verifier
- **WHEN** the Auth0 redirect returns with an authorization code
- **THEN** the system SHALL read `auth_code_verifier` from `sessionStorage`
- **THEN** the system SHALL remove it from `sessionStorage`
- **THEN** the system SHALL send it as `codeVerifier` to `authService.exchangeAuthorizationCode()`

### Requirement: Logout with backend invalidation
The web logout SHALL call `POST /auth/logout` before clearing local state.

#### Scenario: Successful logout
- **WHEN** `logout()` is called
- **THEN** the system SHALL call `authService.logout(accessToken)`
- **THEN** the system SHALL call `authStore.clearAuth()`
- **THEN** the system SHALL call `auth0.logout()` with the return URL
- **THEN** the system SHALL navigate to `/login`

#### Scenario: Backend logout failure
- **WHEN** `authService.logout()` throws an error
- **THEN** the system SHALL log the error
- **THEN** the system SHALL continue with local cleanup (clearAuth + Auth0 logout + navigation)
