## ADDED Requirements

### Requirement: Las estrategias concretas se prueban con dobles de prueba

Cada estrategia concreta (`InAppWebSocketStrategy`, `EmailInstitucionalStrategy`, `PushMovilStrategy`, `ResumenDiarioStrategy`) DEBE tener al menos dos escenarios de prueba: envío exitoso y manejo de error. Ninguna prueba unitaria DEBE depender de un servidor SMTP, WebSocket ni Expo Push reales. Todos los clientes externos DEBEN ser reemplazados por mocks o stubs.

#### Scenario: InAppWebSocketStrategy — envío exitoso
- **WHEN** se invoca `enviar(notificacion)` con un DTO válido
- **THEN** persiste la notificación en BD, emite `notification:new` vía Socket.IO, y retorna `ResultadoEnvio` con `exitoso: true`

#### Scenario: InAppWebSocketStrategy — error de DB
- **WHEN** `prisma.notification.create()` lanza una excepción
- **THEN** retorna `ResultadoEnvio` con `exitoso: false` y el mensaje de error

#### Scenario: EmailInstitucionalStrategy — envío exitoso
- **WHEN** el usuario tiene email registrado y `transporter.sendMail()` responde OK
- **THEN** retorna `ResultadoEnvio` con `exitoso: true`

#### Scenario: EmailInstitucionalStrategy — email no encontrado
- **WHEN** la consulta SQL no retorna email para el usuario
- **THEN** retorna `ResultadoEnvio` con `exitoso: false` y error `'Email no encontrado'`

#### Scenario: PushMovilStrategy — sin tokens registrados
- **WHEN** `prisma.user_push_token.findMany()` retorna array vacío
- **THEN** retorna `ResultadoEnvio` con `exitoso: true` (omisión silenciosa)

#### Scenario: PushMovilStrategy — con tokens y Expo API responde OK
- **WHEN** hay tokens registrados y `fetch()` a Expo Push API responde HTTP 200
- **THEN** retorna `ResultadoEnvio` con `exitoso: true`

#### Scenario: PushMovilStrategy — Expo API falla
- **WHEN** `fetch()` a Expo Push API responde HTTP 500
- **THEN** retorna `ResultadoEnvio` con `exitoso: false` y error con código de status

#### Scenario: ResumenDiarioStrategy — encolado exitoso
- **WHEN** se invoca `enviar(notificacion)` con un DTO válido
- **THEN** crea registro en `daily_digest_queue` y retorna `ResultadoEnvio` con `exitoso: true`

### Requirement: El contexto NotificationsService ejecuta estrategias inyectadas con aislamiento de fallos

`NotificationsService` DEBE recibir una lista de estrategias vía inyección de dependencias. Cuando una estrategia falla, las demás DEBEN ejecutarse sin verse afectadas (error isolation mediante `Promise.allSettled`).

#### Scenario: 3 estrategias inyectadas, 1 falla — las otras 2 se ejecutan
- **WHEN** se inyectan 3 estrategias (2 exitosas, 1 que lanza excepción) y se invoca `enviarNotificacion()`
- **THEN** las 3 se ejecutan, el resultado contiene 3 entradas, 2 con `exitoso: true` y 1 con `exitoso: false`

#### Scenario: 3 estrategias inyectadas — todas se ejecutan
- **WHEN** se inyectan 3 estrategias y se invoca `enviarNotificacion()`
- **THEN** cada estrategia se llama exactamente 1 vez

### Requirement: Las preferencias del usuario filtran las estrategias activas

`NotificationsService` DEBE consultar `user_notification_preference` para determinar qué canales están activos por tipo de evento. Las estrategias cuyo canal tiene `activo: false` NO DEBEN ejecutarse.

#### Scenario: Push desactivado — PushMovilStrategy no se ejecuta
- **WHEN** las preferencias del usuario tienen `push_movil` con `activo: false` para el tipo de evento
- **THEN** `PushMovilStrategy.enviar()` NO se invoca y el resultado solo contiene 2 entradas

#### Scenario: Sin preferencias registradas — todas las estrategias se ejecutan (default-on)
- **WHEN** `user_notification_preference` no tiene registros para el usuario y tipo de evento
- **THEN** todas las estrategias inyectadas se ejecutan

### Requirement: El sistema cumple el principio Open/Closed

El `NotificationsService` DEBE consumir cualquier estrategia que implemente `INotificacionStrategy` sin requerir modificaciones en su código. Una nueva estrategia ficticia DEBE poder inyectarse y ejecutarse sin cambios en el contexto.

#### Scenario: Estrategia ficticia "slack" se inyecta y ejecuta
- **WHEN** se agrega una estrategia ficticia con `canal: 'slack'` al array inyectado en `NotificationsService`
- **THEN** la estrategia se ejecuta sin errores y retorna `exitoso: true`
