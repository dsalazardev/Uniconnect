## ADDED Requirements

### Requirement: Web SHALL have a single shared Axios instance
The web frontend SHALL define exactly one shared Axios instance in `constants/api.ts`, consumed by all feature services, matching the mobile pattern.

#### Scenario: All services use the same api instance
- **WHEN** any feature's `services/index.ts` creates a service from `@uniconnect/shared`
- **THEN** it SHALL import `api` from `@/constants/api` (NOT call `createApiClient()`)
- **AND** the shared `api` SHALL be the single source of truth for base URL, timeout, headers, and interceptors

#### Scenario: Web api instance has token interceptors
- **WHEN** the web `api` instance is created via `createApiClient()`
- **THEN** it SHALL have the same auth interceptor behavior as the mobile instance:
  - Bearer token attached to requests
  - Token refresh mutex (FIX-10)
  - 401 retry with queue
  - Auth-ready guard (`isReady`)

### Requirement: Per-feature createApiClient() calls SHALL be removed
All 9 per-feature `createApiClient()` invocations in `Frontend-web/src/features/*/services/index.ts` SHALL be replaced with the shared `api` import.

#### Scenario: Events services uses shared api
- **WHEN** `events/services/index.ts` creates `new EventsService(...)`
- **THEN** it SHALL pass the shared `api`, not a locally-created client
- **AND** the local `createApiClient()` call SHALL be removed

#### Scenario: Groups, notifications, and all other services follow the pattern
- **WHEN** each feature service is instantiated
- **THEN** ALL 9 services SHALL use the shared `api` instance
- **AND** zero `createApiClient()` calls SHALL remain in feature service files

### Requirement: Mobile api instance SHALL remain as-is (single instance)
The mobile frontend already has a single Axios instance pattern in `constants/api.ts`. This SHALL NOT be changed.

#### Scenario: Mobile services continue using shared api
- **WHEN** mobile `services/index.ts` files create service instances
- **THEN** they SHALL continue importing from `@/src/constants/api` (unchanged)
