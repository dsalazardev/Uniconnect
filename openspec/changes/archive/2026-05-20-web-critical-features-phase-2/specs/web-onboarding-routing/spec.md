## ADDED Requirements

### Requirement: Onboarding screen shall be reachable via router
The system SHALL register the Onboarding component as a protected route in the React Router configuration.

#### Scenario: New user navigates to onboarding
- **WHEN** an authenticated user with `needsOnboarding === true` visits `/onboarding`
- **THEN** the OnboardingScreen is rendered
- **AND** the user can complete program and semester selection

#### Scenario: Onboarded user is redirected
- **WHEN** an authenticated user with `needsOnboarding === false` visits `/onboarding`
- **THEN** the user is redirected to `/events`

#### Scenario: Unauthenticated user is redirected
- **WHEN** an unauthenticated user visits `/onboarding`
- **THEN** the user is redirected to `/login`
