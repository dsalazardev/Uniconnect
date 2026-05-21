## ADDED Requirements

### Requirement: Prevent welcome flash during auth callback
The LoginScreen SHALL display a loading spinner during the entire auth callback exchange process, without showing the "Bienvenido" card.

#### Scenario: Successful auth callback
- **WHEN** the Auth0 callback returns a valid code and the token exchange succeeds
- **THEN** the LoginScreen continues showing the spinner until navigation to `/events` completes

#### Scenario: Failed auth callback
- **WHEN** the token exchange fails or the code is invalid
- **THEN** the LoginScreen shows the error message and the login button, not the welcome card

### Requirement: Loading state persists until navigation
The `useWebAuth` hook SHALL maintain `isLoading === true` during a successful auth callback until navigation occurs.

#### Scenario: isLoading stays true on success
- **WHEN** `exchangeAuthorizationCode` succeeds and `authStore.setAuth` is called
- **THEN** `setIsLoading(false)` is NOT called before `navigate()`
