## 1. Dobles de prueba (mocks/stubs) para aislar transportes externos

- [x] 1.1 Crear `src/notifications/test/dobles-de-prueba.ts` con `createPrismaMock()` que cubra: `notification`, `user_push_token`, `daily_digest_queue`, `user_notification_preference`, `$queryRaw`, `$executeRaw`
- [x] 1.2 Agregar `createChatGatewayMock()` con `server.to().emit()` mockeado
- [x] 1.3 Agregar `createSessionManagerMock()` con `getUserSockets()` mockeado
- [x] 1.4 Agregar `createNodemailerMock()` con `createTransport().sendMail()` mockeado
- [x] 1.5 Agregar `createMockStrategy(canal, exitoso)` y `createFailingMockStrategy(canal)` para tests del contexto

## 2. Reparar y completar tests de estrategias concretas en strategy.spec.ts

- [x] 2.1 Actualizar mocks de `PushMovilStrategy` en `strategy.spec.ts`: reemplazar `$queryRaw` por `prismaMock.user_push_token.findMany`
- [x] 2.2 Actualizar mocks de `ResumenDiarioStrategy` en `strategy.spec.ts`: reemplazar `$executeRaw`/`$executeRawUnsafe` por `prismaMock.daily_digest_queue.create`
- [x] 2.3 Verificar que los 3 tests de `PushMovilStrategy` (sin tokens, con tokens éxito, Expo falla) pasan con los nuevos mocks
- [x] 2.4 Verificar que el test de `ResumenDiarioStrategy` (encolado OCP) pasa con el nuevo mock
- [x] 2.5 Verificar que los tests existentes de `InAppWebSocketStrategy` y `EmailInstitucionalStrategy` siguen pasando (sin regresiones)

## 3. Testear inyección de dependencias en NotificationsService (Criterio 3)

- [x] 3.1 Crear `src/notifications/__tests__/notifications.service.spec.ts` con `describe('NotificationsService — Inyección de estrategias')`
- [x] 3.2 Test: "debe ejecutar las 3 estrategias cuando se envía una notificación" (verifica que todas se llaman 1 vez)
- [x] 3.3 Test: "debe aislar el fallo de la estrategia push — las otras 2 retornan exitoso=true" (con 1 fallida, 2 exitosas)

## 4. Testear filtros por preferencias (Criterio 4) y Open/Closed (Criterio 5)

- [x] 4.1 Test: "push desactivado → PushMovilStrategy NO debe ejecutarse" (Criterio 4, preferencias filtran)
- [x] 4.2 Test: "sin preferencias registradas → todas las estrategias se ejecutan (default-on)" (Criterio 4, caso default)
- [x] 4.3 Test: "estrategia ficticia 'slack' con canal nuevo se ejecuta sin modificar NotificationsService" (Criterio 5, OCP)
- [x] 4.4 Ejecutar suite completa de notificaciones y verificar 0 fallos: `npx jest --testPathPatterns='notifications' --no-coverage`
