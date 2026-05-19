## Why

4 test suites (totaling 15 tests) are failing in the messages and events modules due to stale mocks, missing DI providers, and incomplete validation logic in the Chain of Responsibility handler. Additionally, `eas.json` hardcodes the API URL in the `preview` profile, preventing per-developer or per-environment configuration via EAS Secrets.

## What Changes

1. **Fix invalid tests in `validar-menciones.handler.spec.ts` and `validacion-chain.factory.spec.ts`**: Remove 3 tests that expected `MSG_MENCIONES_INVALIDAS` for userId=0/negative. The handler does not validate userId because `userId: 0` is used intentionally as a placeholder in production WebSocket gateway code.
2. **Fix `events.service.spec.ts`**: Add `EventoUniversidadSubject` mock provider to resolve NestJS DI error at module creation time.
3. **Fix `messages.service.spec.ts`**: Replace non-existent `VALIDACION_CHAIN_REST_TOKEN` import with correct `VALIDACION_CHAIN_TOKEN` from `./application/messages.service`.
4. **Fix `messages.controller.spec.ts`**: Update `findRecentByGroup` mock expectation to match the controller's current 5-argument call signature.
5. **Fix `eas.json`**: Remove `env.EXPO_PUBLIC_API_URL` block from the `preview` profile so the value is only set via EAS Secrets dashboard, avoiding hardcoded URLs.

No new capabilities, spec-level requirement changes, or breaking changes.

## Capabilities

### New Capabilities

None — this is a bugfix and configuration change only.

### Modified Capabilities

None — no spec-level requirement changes.

## Impact

- **`Backend/src/messages/domain/chain-of-responsibility/__tests__/validar-menciones.handler.spec.ts`**: 2 test cases removed.
- **`Backend/src/messages/domain/chain-of-responsibility/__tests__/validacion-chain.factory.spec.ts`**: 1 test case removed.
- **`Backend/src/events/events.service.spec.ts`**: 1 new provider in the test module setup.
- **`Backend/src/messages/messages.service.spec.ts`**: 1 import path changed, 1 provider token string changed.
- **`Backend/src/messages/messages.controller.spec.ts`**: 1 expectation updated (arguments to `findRecentByGroup`).
- **`Frontend/Frontend-mobile/eas.json`**: 3 lines removed.
