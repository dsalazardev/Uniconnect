## ADDED Requirements

### Requirement: Restructure Frontend to Frontend-mobile
The system SHALL move existing Frontend directory to Frontend-mobile preserving all functionality.

#### Scenario: All source files copied
- **WHEN** restructuring is complete
- **THEN** Frontend-mobile SHALL contain src/, app/, assets/, __mocks__ directories

#### Scenario: Configuration files copied
- **WHEN** restructuring is complete
- **THEN** Frontend-mobile SHALL contain app.json, babel.config.js, metro.config.js, tsconfig.json, jest.config.js, jest.setup.js

#### Scenario: Package files copied
- **WHEN** restructuring is complete
- **THEN** Frontend-mobile SHALL contain package.json, .env, .gitignore

#### Scenario: Build files copied
- **WHEN** restructuring is complete
- **THEN** Frontend-mobile SHALL contain eas.json, index.js, Dockerfile

#### Scenario: Git history excluded
- **WHEN** restructuring is complete
- **THEN** .git directory SHALL remain at repository root, not copied to Frontend-mobile

#### Scenario: Node modules excluded
- **WHEN** restructuring is complete
- **THEN** node_modules SHALL NOT be copied, will be reinstalled

### Requirement: Consume shared package
The system SHALL import types, services, and endpoints from @uniconnect/shared instead of local files.

#### Scenario: Shared package dependency added
- **WHEN** Frontend-mobile/package.json is inspected
- **THEN** it SHALL contain "@uniconnect/shared": "file:../shared" in dependencies

#### Scenario: Types imported from shared
- **WHEN** feature needs types
- **THEN** it SHALL import from @uniconnect/shared, not local features/*/types/

#### Scenario: Endpoints imported from shared
- **WHEN** feature needs endpoints
- **THEN** it SHALL import from @uniconnect/shared, not local features/*/api/endpoints

#### Scenario: Services instantiated from shared
- **WHEN** feature needs service
- **THEN** it SHALL instantiate service class from @uniconnect/shared with mobile Axios instance

### Requirement: Resolve WebSocket AppState technical debt
The system SHALL implement AppState listener in WebSocketService for proper lifecycle management.

#### Scenario: AppState listener registered on connect
- **WHEN** WebSocketService.connect() is called
- **THEN** it SHALL register AppState.addEventListener('change', handler)

#### Scenario: Disconnect on background
- **WHEN** AppState changes to 'background' or 'inactive'
- **THEN** WebSocket SHALL disconnect

#### Scenario: Reconnect on active
- **WHEN** AppState changes to 'active' and pendingAuthData exists
- **THEN** WebSocket SHALL reconnect

#### Scenario: Listener cleanup on disconnect
- **WHEN** WebSocketService.disconnect() is called
- **THEN** it SHALL remove AppState listener

### Requirement: Resolve GroupAdminStore circular dependency
The system SHALL refactor GroupAdminStore to use dependency injection instead of direct authStore import.

#### Scenario: No direct authStore import
- **WHEN** GroupAdminStore.ts is inspected
- **THEN** it SHALL NOT import authStore directly

#### Scenario: Constructor accepts getCurrentUser function
- **WHEN** GroupAdminStore is instantiated
- **THEN** constructor SHALL accept getCurrentUser: () => User | null parameter

#### Scenario: Uses injected function for user access
- **WHEN** GroupAdminStore needs current user
- **THEN** it SHALL call this.getCurrentUser(), not authStore.user

### Requirement: Remove dead TanStack Query import
The system SHALL remove unused TanStack Query import from GroupAdminStore.

#### Scenario: No TanStack Query import
- **WHEN** GroupAdminStore.ts is inspected
- **THEN** it SHALL NOT contain import from @tanstack/react-query

### Requirement: Migrate NotificationsStore to MobX
The system SHALL migrate NotificationsStore from Zustand to MobX for unified state management.

#### Scenario: Uses MobX makeAutoObservable
- **WHEN** NotificationsStore is inspected
- **THEN** it SHALL use makeAutoObservable(this) in constructor

#### Scenario: No Zustand imports
- **WHEN** NotificationsStore.ts is inspected
- **THEN** it SHALL NOT import from zustand

#### Scenario: MobX observable properties
- **WHEN** NotificationsStore is inspected
- **THEN** unreadCount SHALL be observable property

#### Scenario: MobX action methods
- **WHEN** NotificationsStore methods are called
- **THEN** setUnreadCount, increment, reset SHALL be MobX actions

### Requirement: Remove Zustand dependency
The system SHALL remove Zustand from package dependencies.

#### Scenario: Zustand not in dependencies
- **WHEN** Frontend-mobile/package.json is inspected
- **THEN** it SHALL NOT contain zustand in dependencies or devDependencies

### Requirement: Maintain test coverage
The system SHALL maintain 100% test coverage after restructuring.

#### Scenario: All tests pass
- **WHEN** npm test is run in Frontend-mobile
- **THEN** 228/228 tests SHALL pass

#### Scenario: No test regressions
- **WHEN** tests are run after restructuring
- **THEN** no previously passing tests SHALL fail

### Requirement: Maintain Expo functionality
The system SHALL ensure Expo development server runs without errors after restructuring.

#### Scenario: Expo starts successfully
- **WHEN** npx expo start is run in Frontend-mobile
- **THEN** development server SHALL start without configuration errors

#### Scenario: App builds successfully
- **WHEN** eas build is run
- **THEN** build SHALL complete without errors

### Requirement: Local types replaced with re-exports
The system SHALL replace local type files with re-exports from shared package.

#### Scenario: Events types re-exported
- **WHEN** Frontend-mobile/src/features/events/types/index.ts is inspected
- **THEN** it SHALL contain export type { Event, EventType, EventFilters, CreateEventDTO } from '@uniconnect/shared'

#### Scenario: Groups types re-exported
- **WHEN** Frontend-mobile/src/features/groups/types/index.ts is inspected
- **THEN** it SHALL contain export type { Group, Membership, GroupFilters } from '@uniconnect/shared'

#### Scenario: Messages types re-exported
- **WHEN** Frontend-mobile/src/features/messages/types/index.ts is inspected
- **THEN** it SHALL contain export type { Message, MessageFile, ChatRoom } from '@uniconnect/shared'

### Requirement: Stores and hooks unchanged
The system SHALL maintain existing stores and hooks without modification.

#### Scenario: EventsStore unchanged
- **WHEN** EventsStore is inspected
- **THEN** it SHALL remain identical except for service instantiation

#### Scenario: Hooks unchanged
- **WHEN** hooks are inspected
- **THEN** they SHALL remain identical, no logic changes

#### Scenario: Components unchanged
- **WHEN** components are inspected
- **THEN** they SHALL remain identical, only import paths updated
