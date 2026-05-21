## 1. Resolve Technical Debts in Current Frontend

- [x] 1.1 Add AppState listener to WebSocketService (connect/disconnect on app state changes)
- [x] 1.2 Refactor GroupAdminStore to accept getCurrentUser function in constructor (remove direct authStore import)
- [x] 1.3 Remove dead TanStack Query import from GroupAdminStore
- [x] 1.4 Migrate NotificationsStore from Zustand to MobX (makeAutoObservable, observable properties, action methods)
- [x] 1.5 Remove zustand from Frontend/package.json dependencies
- [x] 1.6 Run npm test and verify 228/228 tests pass

## 2. Create Monorepo Structure

- [x] 2.1 Copy Frontend to Frontend-mobile using rsync (exclude .git, node_modules, package-lock.json)
- [x] 2.2 Run npm install in Frontend-mobile
- [x] 2.3 Verify npx expo start works in Frontend-mobile
- [x] 2.4 Create shared directory at repository root
- [x] 2.5 Create shared/package.json with name "@uniconnect/shared" and version "1.0.0"
- [x] 2.6 Create shared/tsconfig.json with strict: true and noImplicitAny: true
- [x] 2.7 Create shared/src directory structure (types/, api/, services/, validators/, utils/)

## 3. Extract Types to Shared Package

- [x] 3.1 Create shared/src/types/common.ts with FENResponse, PaginationMetadata, ErrorDetails
- [x] 3.2 Copy events types from Frontend-mobile to shared/src/types/events.ts
- [x] 3.3 Copy users types from Frontend-mobile to shared/src/types/users.ts
- [x] 3.4 Copy groups types from Frontend-mobile to shared/src/types/groups.ts
- [x] 3.5 Copy messages types from Frontend-mobile to shared/src/types/messages.ts
- [x] 3.6 Copy notifications types from Frontend-mobile to shared/src/types/notifications.ts
- [x] 3.7 Copy connections types from Frontend-mobile to shared/src/types/connections.ts
- [x] 3.8 Copy courses types from Frontend-mobile to shared/src/types/courses.ts
- [x] 3.9 Copy programs types from Frontend-mobile to shared/src/types/programs.ts
- [x] 3.10 Copy students types from Frontend-mobile to shared/src/types/students.ts
- [x] 3.11 Create shared/src/types/index.ts barrel export
- [x] 3.12 Run tsc --noEmit in shared directory and verify no errors

## 4. Extract API Endpoints to Shared Package

- [x] 4.1 Copy events endpoints from Frontend-mobile to shared/src/api/endpoints/events.ts
- [x] 4.2 Copy groups endpoints from Frontend-mobile to shared/src/api/endpoints/groups.ts
- [x] 4.3 Copy messages endpoints from Frontend-mobile to shared/src/api/endpoints/messages.ts
- [x] 4.4 Copy notifications endpoints from Frontend-mobile to shared/src/api/endpoints/notifications.ts
- [x] 4.5 Copy connections endpoints from Frontend-mobile to shared/src/api/endpoints/connections.ts
- [x] 4.6 Copy courses endpoints from Frontend-mobile to shared/src/api/endpoints/courses.ts
- [x] 4.7 Copy programs endpoints from Frontend-mobile to shared/src/api/endpoints/programs.ts
- [x] 4.8 Copy students endpoints from Frontend-mobile to shared/src/api/endpoints/students.ts
- [x] 4.9 Copy auth endpoints from Frontend-mobile to shared/src/api/endpoints/auth.ts
- [x] 4.10 Create shared/src/api/endpoints/index.ts barrel export
- [x] 4.11 Verify all endpoints are string constants with no external dependencies

## 5. Create Axios Factory in Shared Package

- [x] 5.1 Extract Axios configuration from Frontend-mobile/src/constants/api.ts
- [x] 5.2 Create shared/src/api/client.ts with createApiClient factory function
- [x] 5.3 Implement mutex pattern for token refresh (isRefreshing flag, failedQueue)
- [x] 5.4 Add FEN response interceptor to factory
- [x] 5.5 Add 401 response interceptor with token refresh logic
- [x] 5.6 Verify factory exports pure function with no side effects
- [x] 5.7 Run tsc --noEmit in shared directory and verify no errors

## 6. Migrate Services to Shared Package with Dependency Injection

- [x] 6.1 Refactor EventsService to accept AxiosInstance in constructor
- [x] 6.2 Refactor GroupsService to accept AxiosInstance in constructor
- [x] 6.3 Refactor MessagesService to accept AxiosInstance in constructor
- [x] 6.4 Refactor NotificationsService to accept AxiosInstance in constructor
- [x] 6.5 Refactor ConnectionsService to accept AxiosInstance in constructor
- [x] 6.6 Refactor CoursesService to accept AxiosInstance in constructor
- [x] 6.7 Refactor ProgramsService to accept AxiosInstance in constructor
- [x] 6.8 Refactor StudentsService to accept AxiosInstance in constructor
- [x] 6.9 Refactor AuthService to accept AxiosInstance in constructor
- [x] 6.10 Move all services to shared/src/services/
- [x] 6.11 Create shared/src/services/index.ts barrel export
- [x] 6.12 Verify all services maintain triple-layer FEN validation
- [x] 6.13 Run tsc --noEmit in shared and verify no errors

## 7. Create Zod Validators in Shared Package

- [x] 7.1 Install zod in shared package
- [x] 7.2 Create shared/src/validators/fen.validator.ts with validateFENResponse function
- [x] 7.3 Create Zod schema for FENResponse structure
- [x] 7.4 Create shared/src/validators/events.validator.ts with Event schema
- [x] 7.5 Create shared/src/validators/groups.validator.ts with Group schema
- [x] 7.6 Create shared/src/validators/index.ts barrel export
- [x] 7.7 Write unit tests for validateFENResponse
- [x] 7.8 Verify tests pass

## 8. Migrate Utilities to Shared Package

- [x] 8.1 Copy debug.ts from Frontend-mobile to shared/src/utils/debug.ts
- [x] 8.2 Copy websocket.config.ts from Frontend-mobile to shared/src/utils/websocket.config.ts
- [x] 8.3 Create shared/src/utils/index.ts barrel export
- [x] 8.4 Verify utilities have no react/react-native/expo dependencies
- [x] 8.5 Create shared/src/index.ts root barrel export

## 9. Update Frontend-mobile to Consume Shared Package

- [x] 9.1 Add "@uniconnect/shared": "file:../shared" to Frontend-mobile/package.json
- [x] 9.2 Run npm install in Frontend-mobile
- [x] 9.3 Replace events types with re-exports from @uniconnect/shared
- [x] 9.4 Replace groups types with re-exports from @uniconnect/shared
- [x] 9.5 Replace messages types with re-exports from @uniconnect/shared
- [x] 9.6 Replace notifications types with re-exports from @uniconnect/shared
- [x] 9.7 Replace connections types with re-exports from @uniconnect/shared
- [x] 9.8 Replace courses types with re-exports from @uniconnect/shared
- [x] 9.9 Replace programs types with re-exports from @uniconnect/shared
- [x] 9.10 Replace students types with re-exports from @uniconnect/shared
- [x] 9.11 Replace auth types with re-exports from @uniconnect/shared
- [x] 9.12 Replace all endpoint imports with imports from @uniconnect/shared
- [x] 9.13 Create service instantiation files in each feature (services/index.ts)
- [x] 9.14 Instantiate services with mobile Axios instance from constants/api
- [x] 9.15 Update all service imports to use new instantiation files
- [x] 9.16 Run npm test and verify 228/228 tests pass
- [x] 9.17 Run npx expo start and verify app works

## 9.5 Fix TypeScript Errors from Service Signature Changes (Fase 9.5)

- [x] 9.5.1 Fix Batch 1 (4 files): GroupAdminStore.ts, GroupInvitationCard.tsx, connections.tsx, onboarding.tsx
- [x] 9.5.2 Fix Batch 2 (4 files): ConnectionRequestCard.tsx, ConnectionCard.tsx, useConnections.ts, useGroupInvitations.ts
- [x] 9.5.3 Fix Batch 3 (3 files): useMyGroups.ts, useGroupInfo.ts, usePendingJoinRequests.ts
- [x] 9.5.4 Fix Batch 4 (5 files): useGroups.ts, useChat.ts, useUserNotifications.ts, useProfile.ts (97→77 errors)
- [x] 9.5.5 Fix Batch 5 (~15 files): Component files with service calls (InviteToGroupModal, CreateGroup, EditGroup, MemberRow, TransferOwnershipModal, NewCourse)
- [x] 9.5.6 Fix Batch 6: Type narrowing issues in GroupInvitationCard.tsx (22 errors)
- [x] 9.5.7 Fix Batch 7: Import path issues (Navbar, courses, events tests)
- [x] 9.5.8 Fix Batch 8: Test files (EventCard.bugfix.test.tsx, preservation.bugfix.test.ts)
- [x] 9.5.9 Fix Batch 9: Type exports (event.types.ts, programs/types/index.ts)
- [x] 9.5.10 Fix Batch 10: AuthController type issues (6 errors)
- [x] 9.5.11 Verify npx tsc --noEmit returns Exit Code 0 with zero errors

## 10. Scaffold Frontend-web with Vite

- [x] 10.1 Run npm create vite@latest Frontend-web -- --template react-ts from repository root
- [x] 10.2 Install dependencies in Frontend-web
- [x] 10.3 Install react-router-dom in Frontend-web
- [x] 10.4 Install mobx and mobx-react-lite in Frontend-web
- [x] 10.5 Install axios in Frontend-web
- [x] 10.6 Add "@uniconnect/shared": "file:../shared" to Frontend-web/package.json
- [x] 10.7 Run npm install in Frontend-web
- [x] 10.8 Verify npm run dev starts Vite server on localhost:5173

## 11. Configure Frontend-web Environment and Paths

- [x] 11.1 Create Frontend-web/vite.config.ts with path alias @/ pointing to ./src
- [x] 11.2 Create Frontend-web/.env with VITE_API_URL and VITE_WEBSOCKET_URL
- [x] 11.3 Update Frontend-web/tsconfig.json with strict: true
- [x] 11.4 Add paths configuration to tsconfig.json (@/* maps to ./src/*)
- [x] 11.5 Run tsc --noEmit in Frontend-web and verify no errors

## 12. Create Feature Structure in Frontend-web

- [x] 12.1 Create Frontend-web/src/features/auth directory with subdirectories (components, hooks, store, services)
- [x] 12.2 Create Frontend-web/src/features/events directory with subdirectories
- [x] 12.3 Create Frontend-web/src/features/groups directory with subdirectories
- [x] 12.4 Create Frontend-web/src/features/messages directory with subdirectories
- [x] 12.5 Create Frontend-web/src/features/notifications directory with subdirectories
- [x] 12.6 Create Frontend-web/src/features/students directory with subdirectories
- [x] 12.7 Create Frontend-web/src/features/connections directory with subdirectories
- [x] 12.8 Create Frontend-web/src/features/courses directory with subdirectories
- [x] 12.9 Create Frontend-web/src/features/programs directory with subdirectories
- [x] 12.10 Create Frontend-web/src/features/files directory with subdirectories

## 13. Copy Hooks to Frontend-web

- [x] 13.1 Copy all hooks from Frontend-mobile/src/features/auth/hooks/ to Frontend-web
- [x] 13.2 Copy all hooks from Frontend-mobile/src/features/events/hooks/ to Frontend-web
- [x] 13.3 Copy all hooks from Frontend-mobile/src/features/groups/hooks/ to Frontend-web
- [x] 13.4 Copy all hooks from Frontend-mobile/src/features/messages/hooks/ to Frontend-web
- [x] 13.5 Copy all hooks from Frontend-mobile/src/features/notifications/hooks/ to Frontend-web
- [x] 13.6 Copy all hooks from Frontend-mobile/src/features/students/hooks/ to Frontend-web
- [x] 13.7 Copy all hooks from Frontend-mobile/src/features/connections/hooks/ to Frontend-web
- [x] 13.8 Copy all hooks from Frontend-mobile/src/features/courses/hooks/ to Frontend-web
- [x] 13.9 Copy all hooks from Frontend-mobile/src/features/programs/hooks/ to Frontend-web
- [x] 13.10 Replace Alert calls with window.alert() where needed
- [x] 13.11 Run tsc --noEmit in Frontend-web and verify no errors in hooks

## 14. Copy and Adapt Stores to Frontend-web

- [x] 14.1 Copy EventsStore from Frontend-mobile to Frontend-web (no changes needed)
- [x] 14.2 Copy GroupAdminStore from Frontend-mobile to Frontend-web (no changes needed)
- [x] 14.3 Copy NotificationsStore from Frontend-mobile to Frontend-web (no changes needed)
- [x] 14.4 Copy AuthStore from Frontend-mobile to Frontend-web
- [x] 14.5 Replace expo-secure-store with localStorage in AuthStore
- [x] 14.6 Update AuthStore methods to use localStorage.setItem/getItem/removeItem
- [x] 14.7 Run tsc --noEmit in Frontend-web and verify no errors in stores

## 15. Instantiate Services in Frontend-web

- [x] 15.1 Create Frontend-web/src/features/events/services/index.ts with service instantiation
- [x] 15.2 Create Frontend-web/src/features/groups/services/index.ts with service instantiation
- [x] 15.3 Create Frontend-web/src/features/messages/services/index.ts with service instantiation
- [x] 15.4 Create Frontend-web/src/features/notifications/services/index.ts with service instantiation
- [x] 15.5 Create Frontend-web/src/features/connections/services/index.ts with service instantiation
- [x] 15.6 Create Frontend-web/src/features/courses/services/index.ts with service instantiation
- [x] 15.7 Create Frontend-web/src/features/programs/services/index.ts with service instantiation
- [x] 15.8 Create Frontend-web/src/features/students/services/index.ts with service instantiation
- [x] 15.9 Create Frontend-web/src/features/auth/services/index.ts with service instantiation
- [x] 15.10 Verify all services use createApiClient from @uniconnect/shared

## 16. Adapt WebSocketService for Web

- [x] 16.1 Copy WebSocketService from Frontend-mobile to Frontend-web
- [x] 16.2 Remove AppState import from react-native
- [x] 16.3 Add document.addEventListener('visibilitychange') listener
- [x] 16.4 Implement disconnect when document.hidden becomes true
- [x] 16.5 Implement reconnect when document.hidden becomes false
- [x] 16.6 Verify no react-native imports remain

## 17. Implement React Router v7 Configuration

- [x] 17.1 Create Frontend-web/src/router.tsx
- [x] 17.2 Import createBrowserRouter from react-router-dom
- [x] 17.3 Define route for / (home)
- [x] 17.4 Define route for /events (events list)
- [x] 17.5 Define route for /events/:id (event detail)
- [x] 17.6 Define route for /groups (groups list)
- [x] 17.7 Define route for /groups/:id (group detail)
- [x] 17.8 Define route for /messages (messages list)
- [x] 17.9 Define route for /notifications (notifications list)
- [x] 17.10 Define route for /students (students list)
- [x] 17.11 Define route for /connections (connections list)
- [x] 17.12 Define route for /courses (courses list)
- [x] 17.13 Define route for /programs (programs list)
- [x] 17.14 Export router configuration

## 18. Implement Events Feature Components for Web

- [x] 18.1 Create EventList.tsx component using div/ul/li elements
- [x] 18.2 Create EventCard.tsx component using div/p/button elements
- [x] 18.3 Create EventDetail.tsx component with full event information
- [x] 18.4 Create CreateEventModal.tsx with form/input/select elements
- [x] 18.5 Create EditEventModal.tsx with form elements
- [x] 18.6 Create EventFilters.tsx component
- [x] 18.7 Create CSS Module files for each component
- [x] 18.8 Verify components use useEvents hook from hooks directory
- [x] 18.9 Verify components render without errors in browser

## 19. Implement Groups Feature Components for Web

- [x] 19.1 Create GroupList.tsx component
- [x] 19.2 Create GroupCard.tsx component
- [x] 19.3 Create GroupDetail.tsx component
- [x] 19.4 Create CreateGroupModal.tsx component
- [x] 19.5 Create MemberList.tsx component
- [x] 19.6 Create InviteMemberModal.tsx component
- [x] 19.7 Create CSS Module files for each component
- [x] 19.8 Verify components use hooks from hooks directory

## 20. Implement Messages Feature Components for Web

- [x] 20.1 Create MessageList.tsx component
- [x] 20.2 Create MessageInput.tsx component
- [x] 20.3 Create ChatHeader.tsx component
- [x] 20.4 Create FileUpload.tsx component
- [x] 20.5 Create TypingIndicator.tsx component
- [x] 20.6 Create CSS Module files for each component
- [x] 20.7 Verify components use WebSocketService for real-time updates

## 21. Implement Auth Feature Components for Web

- [x] 21.1 Create LoginScreen.tsx component
- [x] 21.2 Create OnboardingScreen.tsx component
- [x] 21.3 Create ProfileScreen.tsx component
- [x] 21.4 Create CSS Module files for each component
- [x] 21.5 Integrate Auth0 authentication flow for web

## 22. Implement Notifications Feature Components for Web

- [x] 22.1 Create NotificationCenter.tsx component
- [x] 22.2 Create NotificationItem.tsx component
- [x] 22.3 Create NotificationBadge.tsx component
- [x] 22.4 Create CSS Module files for each component

## 23. Implement Students Feature Components for Web

- [x] 23.1 Create StudentList.tsx component
- [x] 23.2 Create StudentCard.tsx component
- [x] 23.3 Create StudentProfile.tsx component
- [x] 23.4 Create CSS Module files for each component

## 24. Implement Connections Feature Components for Web

- [x] 24.1 Create ConnectionList.tsx component
- [x] 24.2 Create ConnectionRequest.tsx component
- [x] 24.3 Create CSS Module files for each component

## 25. Implement Courses and Programs Feature Components for Web

- [x] 25.1 Create CourseList.tsx component
- [x] 25.2 Create ProgramList.tsx component
- [x] 25.3 Create CSS Module files for each component

## 26. Configure Workspace Root

- [x] 26.1 Create package.json at repository root
- [x] 26.2 Add workspaces field with ["shared", "Frontend-mobile", "Frontend-web"]
- [x] 26.3 Add dev:mobile script (cd Frontend-mobile && npx expo start)
- [x] 26.4 Add dev:web script (cd Frontend-web && npm run dev)
- [x] 26.5 Add dev:backend script (cd Backend && npm run start:dev)
- [x] 26.6 Add build:shared script (cd shared && npm run build)
- [x] 26.7 Add build:web script (cd Frontend-web && npm run build)
- [x] 26.8 Add test:mobile script (cd Frontend-mobile && npm test)
- [x] 26.9 Add test:web script (cd Frontend-web && npm test)
- [x] 26.10 Add test:all script (npm run test:mobile && npm run test:web)
- [x] 26.11 Add typecheck:shared script (cd shared && npx tsc --noEmit)
- [x] 26.12 Add typecheck:web script (cd Frontend-web && npx tsc --noEmit)
- [x] 26.13 Add typecheck:all script (npm run typecheck:shared && npm run typecheck:web)
- [x] 26.14 Create root .gitignore with node_modules/, dist/, .expo/, .env
- [x] 26.15 Create root README.md with workspace setup instructions
- [x] 26.16 Run npm install from root and verify workspace linking

## 27. Create Test Suite for Frontend-web

- [x] 27.1 Install vitest in Frontend-web
- [x] 27.2 Install @testing-library/react in Frontend-web
- [x] 27.3 Install @testing-library/user-event in Frontend-web
- [x] 27.4 Create vitest.config.ts in Frontend-web
- [x] 27.5 Create tests for EventsService
- [x] 27.6 Create tests for GroupsService
- [x] 27.7 Create tests for useEvents hook
- [x] 27.8 Create tests for useGroups hook
- [x] 27.9 Create tests for EventCard component
- [x] 27.10 Create tests for EventList component
- [x] 27.11 Run npm test in Frontend-web and verify tests pass

## 28. Final Verification and Documentation

- [x] 28.1 Run npm run dev:mobile from root and verify mobile app starts
- [x] 28.2 Run npm run dev:web from root and verify web app starts
- [x] 28.3 Run npm run test:all from root and verify all tests pass
- [x] 28.4 Run npm run typecheck:all from root and verify no TypeScript errors
- [x] 28.5 Update AGENTS.md with new monorepo structure documentation
- [x] 28.6 Document shared package usage patterns in AGENTS.md
- [x] 28.7 Document component adaptation rules (React Native → React DOM) in AGENTS.md
- [x] 28.8 Document workspace development scripts in AGENTS.md
- [x] 28.9 Verify Git history is intact (git log shows all commits)
- [x] 28.10 Create migration guide document for team
