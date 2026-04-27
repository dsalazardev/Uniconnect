## 1. Pre-Implementation Audit

- [ ] 1.1 Search codebase for other MobX stores using decorators (`grep -r "@observable" src/`)
- [ ] 1.2 Verify current MobX version in package.json (should be 6.15.0)
- [ ] 1.3 Backup current events.store.ts for reference

## 2. Refactor EventsStore to makeAutoObservable

- [ ] 2.1 Remove all `@observable` decorators from property declarations
- [ ] 2.2 Remove all `@action` decorators from method declarations
- [ ] 2.3 Remove all `@computed` decorators from getter methods
- [ ] 2.4 Replace `makeObservable(this)` with `makeAutoObservable(this)` in constructor
- [ ] 2.5 Verify all imports still include `makeAutoObservable` from 'mobx'
- [ ] 2.6 Remove unused `makeObservable` import if no longer needed

## 3. Update TypeScript Configuration

- [ ] 3.1 Open `tsconfig.json` in Uniconnect-Frontend directory
- [ ] 3.2 Add `"experimentalDecorators": true` to `compilerOptions` object
- [ ] 3.3 Verify JSON syntax is valid (no trailing commas)

## 4. Clear Metro Cache and Test Build

- [ ] 4.1 Stop any running Expo dev server
- [ ] 4.2 Run `npx expo start -c` to clear cache and start fresh
- [ ] 4.3 Verify build completes without "Decorating class property failed" error
- [ ] 4.4 Check console for any MobX warnings or errors

## 5. Functional Testing

- [ ] 5.1 Test events load on app start (verify `loadEvents()` works)
- [ ] 5.2 Test filter functionality (date, type, date range filters)
- [ ] 5.3 Test create event form submission
- [ ] 5.4 Test edit event modal and update functionality
- [ ] 5.5 Test delete event functionality
- [ ] 5.6 Verify loading states display correctly during async operations
- [ ] 5.7 Verify error states display correctly when API calls fail
- [ ] 5.8 Test computed value `upcomingEvents` returns correct filtered results

## 6. Web Build Verification

- [ ] 6.1 Run `npx expo start --web` to test web build
- [ ] 6.2 Verify web build completes without decorator errors
- [ ] 6.3 Test basic event functionality in web browser

## 7. Documentation and Cleanup

- [ ] 7.1 Add comment in events.store.ts explaining makeAutoObservable pattern
- [ ] 7.2 Update AGENTS.md if MobX patterns are documented there
- [ ] 7.3 Document cache clearing requirement in deployment notes
- [ ] 7.4 Remove backup file created in task 1.3

## 8. Final Verification

- [ ] 8.1 Run full test suite if tests exist (`npm test`)
- [ ] 8.2 Verify no TypeScript compilation errors
- [ ] 8.3 Verify no console warnings in development mode
- [ ] 8.4 Commit changes with descriptive message: "fix: refactor EventsStore to use makeAutoObservable instead of decorators"
