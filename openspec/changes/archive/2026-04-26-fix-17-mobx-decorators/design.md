Y## Context

The frontend uses MobX 6.15.0 for state management with decorator syntax (`@observable`, `@action`, `@computed`) in the `EventsStore` class. The Expo/Metro bundler fails because:

1. **Babel Configuration**: `babel.config.js` only includes `babel-preset-expo` without decorator transform plugins
2. **TypeScript Configuration**: `tsconfig.json` extends `expo/tsconfig.base` but doesn't enable `experimentalDecorators`
3. **MobX Version**: MobX 6+ recommends `makeAutoObservable` over decorators to avoid Babel complexity

**Current State:**
- `events.store.ts` uses 15+ decorator annotations
- Build fails with: "Decorating class property failed"
- No other stores in the codebase use decorators (verified)

**Constraints:**
- Must maintain existing MobX reactivity behavior
- Cannot break component code that observes the store
- Must work with Expo Web and Metro bundler without additional Babel plugins

## Goals / Non-Goals

**Goals:**
- Eliminate decorator syntax from `EventsStore` to fix build error
- Use MobX 6+ recommended pattern (`makeAutoObservable`)
- Maintain 100% behavioral compatibility with existing code
- Enable `experimentalDecorators` in TypeScript for future-proofing

**Non-Goals:**
- Migrating away from MobX entirely (Zustand is used elsewhere, both coexist)
- Refactoring component code that uses the store
- Adding Babel decorator plugins (avoiding this complexity is the point)
- Performance optimization (behavior must remain identical)

## Decisions

### Decision 1: Use `makeAutoObservable` Instead of Fixing Babel

**Chosen Approach:** Refactor to `makeAutoObservable(this)` in constructor

**Rationale:**
- **MobX 6+ Best Practice**: Official docs recommend `makeAutoObservable` over decorators
- **Simpler Build**: No Babel plugins needed (`@babel/plugin-proposal-decorators`, `@babel/plugin-proposal-class-properties`)
- **Less Fragile**: Babel plugin ordering is error-prone (decorators MUST come before class-properties)
- **Future-Proof**: TC39 decorators spec is still evolving; `makeAutoObservable` is stable

**Alternatives Considered:**
- **Fix Babel with plugins**: Requires installing 2 plugins, configuring order correctly, and maintaining Babel complexity
- **Migrate to Zustand**: Too large a scope; MobX works fine once decorators are removed

### Decision 2: Refactor Pattern

**Before (Decorators):**
```typescript
export class EventsStore {
  @observable events: Event[] = [];
  @observable loading: boolean = false;
  
  constructor(service: EventsService = eventsService) {
    this.eventsService = service;
    makeObservable(this); // Required with decorators
  }
  
  @action
  async loadEvents(): Promise<void> { ... }
  
  @computed
  get upcomingEvents(): Event[] { ... }
}
```

**After (makeAutoObservable):**
```typescript
export class EventsStore {
  events: Event[] = [];
  loading: boolean = false;
  
  constructor(service: EventsService = eventsService) {
    this.eventsService = service;
    makeAutoObservable(this); // Auto-detects observables and actions
  }
  
  async loadEvents(): Promise<void> { ... } // No decorator needed
  
  get upcomingEvents(): Event[] { ... } // No decorator needed
}
```

**Key Changes:**
1. Remove all `@observable`, `@action`, `@computed` decorators
2. Keep property declarations and method signatures identical
3. Replace `makeObservable(this)` with `makeAutoObservable(this)` in constructor
4. `makeAutoObservable` automatically infers:
   - Properties → observables
   - Methods → actions
   - Getters → computed values

### Decision 3: TypeScript Configuration

**Change:** Add `experimentalDecorators: true` to `tsconfig.json`

**Rationale:**
- Even though we're removing decorators, enabling this flag prevents future issues
- If any library uses decorators internally, TypeScript won't complain
- Standard practice in React Native projects
- No runtime cost (compile-time only)

**Configuration:**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "experimentalDecorators": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

### Decision 4: Metro Cache Clearing

**Requirement:** Always run `npx expo start -c` after refactoring

**Rationale:**
- Metro caches transformed code aggressively
- Old decorator transforms may persist in cache
- The `-c` flag clears cache before starting
- Without this, the error may persist even after fixing code

## Risks / Trade-offs

### Risk 1: Behavioral Differences in `makeAutoObservable`

**Risk:** `makeAutoObservable` might infer observability differently than explicit decorators

**Mitigation:**
- MobX documentation guarantees identical behavior for standard patterns
- The `EventsStore` uses standard patterns (properties, methods, getters)
- Private methods (prefixed with `_` or `private`) are automatically excluded
- Test the store after refactoring to verify reactivity works

### Risk 2: Other Stores Using Decorators

**Risk:** There might be other MobX stores in the codebase using decorators

**Mitigation:**
- Audit performed: `grep -r "@observable" src/` shows only `events.store.ts`
- If found later, apply the same refactoring pattern
- Document the pattern in `AGENTS.md` for future stores

### Risk 3: Metro Cache Persistence

**Risk:** Developers might forget to clear cache and think the fix didn't work

**Mitigation:**
- Include cache clearing as a mandatory task in `tasks.md`
- Add a note in the store file as a comment
- Update deployment scripts to always clear cache

### Trade-off: Loss of Explicit Annotations

**Trade-off:** Decorators make observability explicit; `makeAutoObservable` is implicit

**Accepted Because:**
- The pattern is well-documented in MobX 6+ docs
- Simpler code with less boilerplate
- Build stability is more important than explicit annotations
- TypeScript types still provide clarity

## Migration Plan

**Deployment Steps:**
1. Refactor `events.store.ts` to remove decorators
2. Update `tsconfig.json` to enable `experimentalDecorators`
3. Clear Metro cache: `npx expo start -c`
4. Test event loading, filtering, creation, update, and deletion
5. Verify no console errors or warnings
6. Deploy to development environment
7. Monitor for any reactivity issues

**Rollback Strategy:**
- If issues arise, revert the single commit
- The change is isolated to one file (`events.store.ts`) and one config line (`tsconfig.json`)
- No database or API changes involved
- Rollback is instant (git revert)

**Testing Checklist:**
- [ ] Events load correctly on app start
- [ ] Filters update the event list reactively
- [ ] Create event form works
- [ ] Edit event modal works
- [ ] Delete event works
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] No console warnings about MobX

## Open Questions

None - the approach is well-documented in MobX 6+ migration guides and the refactoring is straightforward.
