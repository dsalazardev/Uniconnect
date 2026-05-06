## Why

The current repository structure assumes a single React Native/Expo frontend with all configuration files (package.json, babel.config.js, metro.config.js, app.json) at the root. This prevents adding a web frontend using Vite without bundler conflicts and makes it impossible to share platform-agnostic business logic between mobile and web.

## What Changes

- Restructure repository into npm workspaces monorepo with three packages
- Move existing `/Frontend` to `/Frontend-mobile` preserving Git history
- Create new `/Frontend-web` with React + Vite + TypeScript
- Create `/shared` package for platform-agnostic code (types, services, endpoints, validators)
- Extract 2,837 lines of shared logic from mobile to `/shared` package
- Refactor all services to use dependency injection pattern (accept AxiosInstance in constructor)
- Migrate NotificationsStore from Zustand to MobX for unified state management
- Resolve 4 critical technical debts before migration (WebSocket AppState, circular dependencies, dead imports, state strategy)
- Configure workspace-level scripts for unified development workflow

## Capabilities

### New Capabilities

- `monorepo-structure`: Workspace configuration with npm workspaces linking three packages (Frontend-mobile, Frontend-web, shared)
- `shared-package`: Platform-agnostic TypeScript package with zero React Native/Expo dependencies containing types, services, API endpoints, validators, and utilities
- `web-frontend`: React + Vite web application mirroring mobile functionality with React DOM components, React Router v7, CSS Modules, and MobX state management
- `dependency-injection`: Service layer refactoring to accept AxiosInstance via constructor enabling platform-specific HTTP client injection

### Modified Capabilities

- `mobile-frontend`: Restructure existing Expo app to consume shared package, replace local types/services/endpoints with imports from @uniconnect/shared, resolve technical debts (WebSocket AppState listener, GroupAdminStore circular dependency, NotificationsStore Zustand→MobX migration)

## Impact

- **Files Migrated**: 29 files moved from Frontend to Frontend-mobile (src/, app/, assets/, config files)
- **New Packages**: 3 workspace packages (Frontend-mobile, Frontend-web, shared)
- **Shared Code**: 2,837 lines extracted to /shared (10 type files, 9 service files, 9 endpoint files, 3 validator files, 2 utility files)
- **Web Components**: 80+ new React DOM components across 10 features (auth, events, groups, messages, notifications, students, connections, courses, programs, files)
- **Dependencies**: Add react-router-dom, zod to web; remove zustand from mobile; add @uniconnect/shared to both frontends
- **Build System**: New workspace-level package.json with unified scripts (dev:mobile, dev:web, test:all, typecheck:all)
- **Testing**: Maintain 228/228 existing tests passing, add new test suite for web frontend
- **Breaking Changes**: None - mobile app continues working identically after restructure
