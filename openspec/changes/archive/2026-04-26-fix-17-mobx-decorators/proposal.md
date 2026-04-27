## Why

The Expo Web/Metro bundler is failing with a critical Babel error: "Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform." This occurs in `events.store.ts` when using MobX decorators (`@observable`, `@action`, `@computed`). The root cause is that the project uses MobX 6.15.0 with decorator syntax, but neither Babel nor TypeScript are configured to handle decorators. This blocks development and deployment of the frontend application.

## What Changes

- Refactor `EventsStore` class to use `makeAutoObservable(this)` instead of decorators
- Remove all decorator syntax (`@observable`, `@action`, `@computed`) from the store
- Enable `experimentalDecorators` in `tsconfig.json` for future compatibility
- Add Metro cache clearing step to deployment workflow
- Update any other MobX stores in the codebase that use decorators (if they exist)

## Capabilities

### New Capabilities
- `mobx-modern-syntax`: MobX stores using `makeAutoObservable` pattern without decorators, compatible with Expo/Metro bundler without additional Babel plugins

### Modified Capabilities
<!-- No existing capabilities are being modified - this is a refactoring to fix a build error -->

## Impact

**Affected Code:**
- `src/features/events/store/events.store.ts` - Complete refactor from decorators to `makeAutoObservable`
- `tsconfig.json` - Add `experimentalDecorators: true` for future-proofing
- Any other MobX stores using decorators (audit required)

**Build System:**
- Metro bundler will no longer fail on decorator syntax
- No Babel plugin changes required (cleaner solution)
- Cache clearing required after changes (`npx expo start -c`)

**Runtime:**
- Zero behavioral changes - MobX reactivity works identically
- No breaking changes to component code that observes the store
- Performance remains the same

**Dependencies:**
- No new dependencies required
- Existing `mobx@6.15.0` and `mobx-react-lite@4.1.1` are sufficient
