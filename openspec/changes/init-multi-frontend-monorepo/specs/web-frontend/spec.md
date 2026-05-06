## ADDED Requirements

### Requirement: React + Vite application setup
The system SHALL provide web frontend built with React and Vite bundler.

#### Scenario: Vite configuration exists
- **WHEN** Frontend-web directory is inspected
- **THEN** vite.config.ts SHALL exist with path aliases configured

#### Scenario: Development server runs
- **WHEN** npm run dev is executed in Frontend-web
- **THEN** Vite dev server SHALL start on localhost:5173

#### Scenario: Production build succeeds
- **WHEN** npm run build is executed
- **THEN** optimized bundle SHALL be created in dist directory

### Requirement: Feature-based architecture mirroring mobile
The system SHALL replicate mobile app's feature structure with 10 features.

#### Scenario: All features have directories
- **WHEN** Frontend-web/src/features is inspected
- **THEN** it SHALL contain directories for auth, events, groups, messages, notifications, students, connections, courses, programs, and files

#### Scenario: Each feature has MVC structure
- **WHEN** any feature directory is inspected
- **THEN** it SHALL contain components, hooks, store, and services subdirectories

### Requirement: React DOM components
The system SHALL implement UI components using React DOM primitives instead of React Native components.

#### Scenario: View replaced with div
- **WHEN** mobile component uses View
- **THEN** web component SHALL use div element

#### Scenario: Text replaced with HTML text elements
- **WHEN** mobile component uses Text
- **THEN** web component SHALL use p, span, h1-h6, or other appropriate HTML text elements

#### Scenario: TouchableOpacity replaced with button
- **WHEN** mobile component uses TouchableOpacity
- **THEN** web component SHALL use button element

#### Scenario: TextInput replaced with input
- **WHEN** mobile component uses TextInput
- **THEN** web component SHALL use input element

#### Scenario: FlatList replaced with mapped list
- **WHEN** mobile component uses FlatList
- **THEN** web component SHALL use ul/ol with array.map() rendering

#### Scenario: Image replaced with img
- **WHEN** mobile component uses Image
- **THEN** web component SHALL use img element

### Requirement: Hooks copied without modification
The system SHALL reuse all hooks from mobile frontend without changes.

#### Scenario: Hooks are platform-agnostic
- **WHEN** mobile hooks are inspected
- **THEN** they SHALL only use React hooks (useState, useCallback, useEffect) without React Native APIs

#### Scenario: Hooks copied to web
- **WHEN** Frontend-web/src/features/*/hooks/ is inspected
- **THEN** it SHALL contain identical copies of mobile hooks

#### Scenario: Hooks function identically
- **WHEN** web hook is executed
- **THEN** it SHALL produce same state management behavior as mobile

### Requirement: MobX stores copied with adaptations
The system SHALL reuse MobX stores from mobile with platform-specific adaptations where needed.

#### Scenario: EventsStore copied without changes
- **WHEN** EventsStore is inspected in web
- **THEN** it SHALL be identical to mobile version

#### Scenario: GroupAdminStore copied without changes
- **WHEN** GroupAdminStore is inspected in web
- **THEN** it SHALL be identical to mobile version

#### Scenario: AuthStore adapted for web storage
- **WHEN** AuthStore is inspected in web
- **THEN** it SHALL use localStorage instead of expo-secure-store

#### Scenario: NotificationsStore uses MobX
- **WHEN** NotificationsStore is inspected in web
- **THEN** it SHALL use MobX (not Zustand) matching mobile implementation

### Requirement: React Router v7 navigation
The system SHALL implement routing using React Router v7.

#### Scenario: Router configuration exists
- **WHEN** Frontend-web/src/router.tsx is inspected
- **THEN** it SHALL define routes using createBrowserRouter

#### Scenario: Routes mirror mobile structure
- **WHEN** router configuration is inspected
- **THEN** it SHALL include routes for /, /events, /events/:id, /groups, /groups/:id, /messages, /notifications, /students, /connections, /courses, /programs

#### Scenario: Navigation hooks available
- **WHEN** component needs navigation
- **THEN** useNavigate and useParams hooks SHALL be available

### Requirement: CSS Modules styling
The system SHALL use CSS Modules for component styling.

#### Scenario: CSS Module files exist
- **WHEN** component has styles
- **THEN** corresponding .module.css file SHALL exist

#### Scenario: Styles are scoped
- **WHEN** CSS Module is imported
- **THEN** class names SHALL be automatically scoped to prevent conflicts

#### Scenario: Vite processes CSS Modules
- **WHEN** application builds
- **THEN** Vite SHALL transform CSS Modules into scoped styles

### Requirement: Shared package consumption
The system SHALL consume types, services, and endpoints from @uniconnect/shared package.

#### Scenario: Types imported from shared
- **WHEN** web component needs types
- **THEN** it SHALL import from @uniconnect/shared, not local files

#### Scenario: Services instantiated with web Axios
- **WHEN** service is needed
- **THEN** it SHALL be instantiated with web-specific Axios instance from createApiClient

#### Scenario: Endpoints imported from shared
- **WHEN** API call is made
- **THEN** endpoint constants SHALL be imported from @uniconnect/shared

### Requirement: WebSocket service adapted for web
The system SHALL provide WebSocket service using document visibility API instead of AppState.

#### Scenario: Visibility change listener registered
- **WHEN** WebSocket service connects
- **THEN** it SHALL register document.addEventListener('visibilitychange')

#### Scenario: Disconnect on hidden
- **WHEN** document.hidden becomes true
- **THEN** WebSocket SHALL disconnect

#### Scenario: Reconnect on visible
- **WHEN** document.hidden becomes false and pendingAuthData exists
- **THEN** WebSocket SHALL reconnect

### Requirement: Environment configuration
The system SHALL use Vite environment variables for configuration.

#### Scenario: API URL from environment
- **WHEN** application needs API base URL
- **THEN** it SHALL read from import.meta.env.VITE_API_URL

#### Scenario: WebSocket URL from environment
- **WHEN** application needs WebSocket URL
- **THEN** it SHALL read from import.meta.env.VITE_WEBSOCKET_URL

#### Scenario: Environment file exists
- **WHEN** Frontend-web is inspected
- **THEN** .env file SHALL exist with VITE_API_URL and VITE_WEBSOCKET_URL

### Requirement: TypeScript strict mode
The system SHALL enforce TypeScript strict mode with Zero-Any policy.

#### Scenario: Strict mode enabled
- **WHEN** Frontend-web/tsconfig.json is inspected
- **THEN** it SHALL have strict: true

#### Scenario: No any types
- **WHEN** TypeScript compilation runs
- **THEN** it SHALL produce zero implicit any errors

#### Scenario: Path aliases configured
- **WHEN** code imports using @/ alias
- **THEN** TypeScript SHALL resolve to Frontend-web/src directory

### Requirement: Test suite for web
The system SHALL provide test suite using Vitest and React Testing Library.

#### Scenario: Vitest configured
- **WHEN** Frontend-web is inspected
- **THEN** vitest.config.ts SHALL exist

#### Scenario: Service tests exist
- **WHEN** services are tested
- **THEN** tests SHALL verify FEN response handling and error cases

#### Scenario: Component tests exist
- **WHEN** key components are tested
- **THEN** tests SHALL verify rendering and user interactions

#### Scenario: Hook tests exist
- **WHEN** hooks are tested
- **THEN** tests SHALL verify state management behavior

### Requirement: Functional parity with mobile
The system SHALL replicate all mobile features in web interface.

#### Scenario: Events feature complete
- **WHEN** web events feature is inspected
- **THEN** it SHALL support list, detail, create, edit, delete, and filter operations

#### Scenario: Groups feature complete
- **WHEN** web groups feature is inspected
- **THEN** it SHALL support list, detail, create, join, invite, and admin operations

#### Scenario: Messages feature complete
- **WHEN** web messages feature is inspected
- **THEN** it SHALL support real-time chat, file upload, typing indicators, and message history

#### Scenario: Auth feature complete
- **WHEN** web auth feature is inspected
- **THEN** it SHALL support Auth0 login, token refresh, and logout
