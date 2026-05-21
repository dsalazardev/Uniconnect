## Context

UniConnect currently has a single React Native/Expo frontend with configuration files at the repository root. The project needs to add a web frontend while sharing business logic between platforms. The current structure makes this impossible due to bundler conflicts (Metro vs Vite) and lack of code organization for platform-agnostic logic.

**Current State:**
- 228 passing tests in mobile frontend
- 10 features with MVC architecture (components, hooks, stores, services)
- Services directly import global Axios instance from constants/api
- NotificationsStore uses Zustand while rest of app uses MobX
- 4 critical technical debts identified (WebSocket lifecycle, circular dependencies, dead imports, inconsistent state management)

**Constraints:**
- Must preserve Git history (`.git` stays at root)
- Must maintain 100% test coverage (228/228 tests passing)
- Must follow Zero-Any Policy and FENResponse<T> contract from AGENTS.md
- Cannot break existing mobile app functionality

## Goals / Non-Goals

**Goals:**
- Enable parallel development of mobile and web frontends
- Eliminate code duplication through shared package
- Establish dependency injection pattern for testability
- Unify state management on MobX across all features
- Resolve technical debts before propagating to web

**Non-Goals:**
- Migrating from npm to pnpm/yarn workspaces (keep existing tooling)
- Adding Tailwind CSS to web (use CSS Modules, Tailwind can be added later)
- Rewriting mobile components (only restructure, not refactor)
- Changing backend APIs or contracts

## Decisions

### Decision 1: npm workspaces over pnpm/yarn

**Choice:** Use npm workspaces

**Rationale:** Project already uses npm (package-lock.json exists). Migrating to pnpm would require team agreement and tooling changes. npm workspaces provide sufficient functionality for linking three packages.

**Alternatives Considered:**
- pnpm workspaces: Better disk space efficiency but requires migration
- yarn workspaces: Similar to npm but adds another tool

### Decision 2: Dependency Injection for Services

**Choice:** Refactor all services to accept `AxiosInstance` in constructor

**Rationale:** Enables platform-specific HTTP clients (mobile uses Expo-specific interceptors, web uses browser-specific). Makes services testable with mock clients. Follows SOLID principles.

**Pattern:**
```typescript
export class EventsService {
  constructor(private readonly httpClient: AxiosInstance) {}
  async getEvents(): Promise<FENResponse<Event[]>> {
    return this.httpClient.get('/events');
  }
}
```

**Alternatives Considered:**
- Global Axios instance: Couples services to platform, hard to test
- Service locator pattern: More complex, harder to trace dependencies

### Decision 3: MobX for All State Management

**Choice:** Migrate NotificationsStore from Zustand to MobX

**Rationale:** 75% of stores already use MobX. MobX provides computed properties and `runInAction` for async mutations. Unifying on one library reduces bundle size and cognitive load.

**Alternatives Considered:**
- Keep Zustand: Maintains status quo but perpetuates inconsistency
- Migrate all to Zustand: More work, loses MobX computed properties

### Decision 4: React Router v7 for Web

**Choice:** Use React Router v7 for web routing

**Rationale:** Conceptually similar to Expo Router (both support file-based routing in latest versions). Hooks like `useNavigate`/`useParams` mirror Expo Router's `useRouter`/`useLocalSearchParams`.

**Alternatives Considered:**
- TanStack Router: Less mature, smaller ecosystem
- Next.js: Overkill for SPA, adds server-side complexity

### Decision 5: CSS Modules for Web Styling

**Choice:** Use CSS Modules (`.module.css`)

**Rationale:** Built into Vite with zero configuration. Provides scoped styles without additional dependencies. Tailwind can be added later if needed.

**Alternatives Considered:**
- Tailwind CSS: Requires setup, increases scope
- Styled-components: Runtime overhead, not Vite-native

### Decision 6: Platform-Specific Store Adaptations

**Choice:** AuthStore uses `expo-secure-store` on mobile, `localStorage` on web

**Rationale:** Secure storage APIs differ by platform. AuthStore is the only store with platform dependencies. All other stores (EventsStore, GroupAdminStore, NotificationsStore) are platform-agnostic.

**Implementation:**
```typescript
// Mobile: await SecureStore.setItemAsync(key, value)
// Web: localStorage.setItem(key, value)
```

**Alternatives Considered:**
- Abstract storage layer: Over-engineering for single store
- IndexedDB on web: More complex than needed for tokens

### Decision 7: Zod for Runtime Validation

**Choice:** Use Zod schemas for FENResponse validation in shared package

**Rationale:** Provides runtime type safety for API responses. Catches backend contract violations early. Integrates well with TypeScript.

**Pattern:**
```typescript
export function validateFENResponse<T>(schema: z.ZodSchema<T>) {
  // Validate response.data against schema
}
```

**Alternatives Considered:**
- io-ts: More verbose syntax
- Manual validation: Error-prone, no type inference

### Decision 8: WebSocket Lifecycle Management

**Choice:** Mobile uses `AppState` listener, web uses `document.visibilitychange`

**Rationale:** Platforms have different APIs for detecting app/tab visibility. Mobile needs to disconnect WebSocket when app goes to background. Web needs to disconnect when tab is hidden.

**Implementation:**
```typescript
// Mobile: AppState.addEventListener('change', handler)
// Web: document.addEventListener('visibilitychange', handler)
```

**Alternatives Considered:**
- Keep connection always open: Wastes resources, battery drain
- Polling instead of WebSocket: Higher latency, more server load

## Risks / Trade-offs

### Risk 1: Breaking Changes During Service Refactoring
**Mitigation:** Maintain existing test suite (228 tests) as regression safety net. Refactor services one at a time, verify tests pass after each.

### Risk 2: Hooks Incompatibility Between React Native and React DOM
**Mitigation:** Hooks only use React primitives (useState, useCallback, useEffect), no platform-specific APIs. Copy hooks without modification.

### Risk 3: AuthStore Platform Divergence
**Mitigation:** Document platform-specific adaptations clearly. Create adapter pattern if more stores need platform-specific logic in future.

### Risk 4: Type Desynchronization Between /shared and Backend
**Mitigation:** Establish update process: Backend updates DTOs → update /shared types → both frontends get updates automatically via workspace link.

### Risk 5: Bundle Size Increase with MobX on Web
**Mitigation:** Vite tree-shaking eliminates unused code. MobX is already used on mobile, so no new dependency.

### Risk 6: AppState vs visibilitychange Semantic Differences
**Mitigation:** Document difference: `visibilitychange` fires per-tab, `AppState` fires per-app. Both achieve goal of disconnecting inactive connections.

### Risk 7: Workspace Hoisting Conflicts
**Mitigation:** Use `file:` protocol for @uniconnect/shared dependency to avoid npm registry issues. Test workspace installation thoroughly.

## Migration Plan

### Phase 1: Resolve Technical Debts (1 day)
1. Add AppState listener to WebSocketService
2. Remove circular dependency in GroupAdminStore (use DI)
3. Remove dead TanStack Query import
4. Migrate NotificationsStore to MobX
5. Verify 228/228 tests still pass

### Phase 2: Create Monorepo Structure (1 day)
1. Copy `/Frontend` to `/Frontend-mobile` (exclude .git, node_modules)
2. Create `/shared` directory with package.json
3. Create workspace root package.json
4. Verify mobile app still runs

### Phase 3: Extract Shared Code (2 days)
1. Migrate types to `/shared/src/types/`
2. Migrate endpoints to `/shared/src/api/endpoints/`
3. Create Axios factory in `/shared/src/api/client.ts`
4. Migrate services with DI pattern to `/shared/src/services/`
5. Create Zod validators in `/shared/src/validators/`
6. Migrate utilities to `/shared/src/utils/`

### Phase 4: Update Mobile to Consume Shared (1 day)
1. Add `@uniconnect/shared` dependency to Frontend-mobile
2. Replace local imports with shared package imports
3. Instantiate services with mobile Axios instance
4. Verify 228/228 tests still pass

### Phase 5: Create Web Frontend (2 days)
1. Scaffold Frontend-web with Vite
2. Copy hooks and stores from mobile (adapt AuthStore)
3. Implement React DOM components for all features
4. Configure React Router v7
5. Add CSS Modules styling
6. Create test suite for web

**Rollback Strategy:**
- Phase 1-2: Git revert commits
- Phase 3-4: Keep Frontend-mobile working independently, can remove shared package
- Phase 5: Web is additive, can be deleted without affecting mobile

**Deployment:**
- Mobile: No changes to deployment (still uses EAS Build)
- Web: New deployment target (Vercel/Netlify/S3+CloudFront)
- Backend: No changes required

## Open Questions

1. **Web Authentication Flow:** Should web use Auth0 Universal Login or embedded login? (Affects UX and security model)
2. **Web Push Notifications:** Use Web Push API or polling? (Affects real-time notification delivery)
3. **Web File Upload:** Use same S3 presigned URL flow as mobile or direct upload? (Affects CORS configuration)
4. **Shared Package Versioning:** Use semantic versioning or always link latest? (Affects stability vs agility)
5. **Web Deployment Target:** Vercel, Netlify, or S3+CloudFront? (Affects CI/CD setup)
6. **Mobile App Updates:** Coordinate web launch with mobile app update? (Affects feature parity)
7. **Analytics Integration:** Separate analytics for web and mobile or unified? (Affects tracking strategy)
