# US-V04 — Encuestas Rápidas en Chat de Grupo

---

## FRONTEND

### 1. Título: SHARED — PollDecorator, servicio de votación y listener WebSocket

**Prompt Sugerido:**
En el módulo `shared/` implementar toda la lógica reutilizable de encuestas:

1. **PollDecorator:** Aplicar el patrón Decorator sobre la interfaz/clase base de mensaje ya existente del Sprint 3 (sin modificarla). El decorador envuelve el componente base y añade: encabezado de encuesta, opciones con estado de voto, porcentaje por opción y estado `ACTIVE | CLOSED`. Debe ser composable con los demás decoradores del Sprint 3 (`ReactionDecorator`, `FileDecorator`, etc.) sin alterar sus clases. Props esperadas: `pollId`, `question`, `options[]`, `closesAt`, `userVote` (null si no ha votado).

2. **PollService (shared/services/poll.service):** Encapsular las llamadas al backend: `createPoll(groupId, payload)`, `castVote(pollId, optionId)`, `getPoll(pollId)`. Todos los componentes de ambas plataformas consumen este servicio.

3. **usePollSocket / PollSocketHandler (shared/hooks o shared/handlers):** Lógica de suscripción a eventos WebSocket `poll:vote_updated` y `poll:closed`. Al recibir `poll:vote_updated` actualizar el estado local con los nuevos porcentajes sin refetch. Al recibir `poll:closed` marcar la encuesta como cerrada y deshabilitar votación. Este hook/handler es importado tanto por el dashboard web como el móvil.

**Commit:**
`feat(shared): agregar PollDecorator, PollService y handler WebSocket de encuestas`

**Estimación:**
4 horas

---

### 2. Título: Web Dashboard — Renderizado de encuesta en chat de grupo

**Prompt Sugerido:**
En el dashboard web (`web/`), integrar los elementos de `shared/` en la vista del chat de grupo:

1. Importar y montar `PollDecorator` desde `shared/` dentro del renderizador de mensajes del chat de grupo web, distinguiendo visualmente la encuesta del texto plano con badge "ENCUESTA" y barra de progreso por opción.
2. Conectar `usePollSocket` / `PollSocketHandler` al contexto del grupo activo para que los resultados se actualicen en tiempo real para todos los participantes conectados.
3. Añadir el formulario de creación de encuesta (pregunta, opciones, `closesAt`) accesible desde la barra de herramientas del chat, que invoca `PollService.createPoll`.
4. Manejar el estado `userVote !== null`: resaltar la opción seleccionada y deshabilitar el resto desde el renderizado inicial.

**Commit:**
`feat(web): integrar PollDecorator y votación en tiempo real en el chat de grupo web`

**Estimación:**
4 horas

---

### 3. Título: Mobile Dashboard — Renderizado de encuesta en chat de grupo

**Prompt Sugerido:**
En el dashboard móvil (`mobile/`), integrar los elementos de `shared/` en la vista del chat de grupo:

1. Crear el componente `PollMessageCard` que consuma `PollDecorator` de `shared/` y lo adapte a la UI nativa (botones táctiles, layout responsive para pantallas pequeñas, countdown visual hasta `closesAt`).
2. Conectar `usePollSocket` / `PollSocketHandler` al mismo canal del grupo para recibir actualizaciones en tiempo real igual que la versión web.
3. Al votar, llamar a `PollService.castVote` desde `shared/services`. Aplicar optimistic UI: deshabilitar botones localmente de inmediato y revertir si el servidor responde con error.
4. Mostrar el mensaje de error del backend (`"Ya registraste tu voto en esta encuesta"`) en un toast o alerta nativa si el servidor rechaza el voto duplicado.

**Commit:**
`feat(mobile): integrar PollMessageCard con lógica compartida en el chat de grupo móvil`

**Estimación:**
3 horas

---

## BACKEND

### 4. Título: Modelo Poll, endpoints REST y validación de voto único

**Prompt Sugerido:**
Crear la entidad `Poll` con campos: `id`, `groupId`, `createdBy`, `question`, `options: [{id, text, votes[]}]`, `closesAt: DateTime`, `status: ACTIVE | CLOSED`, `createdAt`. Crear la entidad `PollVote` con: `pollId`, `userId`, `optionId`, `createdAt` y constraint unique(`pollId`, `userId`). Exponer los endpoints: `POST /api/groups/:groupId/polls` (crear encuesta, validar `closesAt` en el futuro), `POST /api/polls/:pollId/vote` (registrar voto; si ya existe un `PollVote` para ese `userId + pollId` retornar HTTP 409 con body `{ message: "Ya registraste tu voto en esta encuesta" }`), `GET /api/polls/:pollId` (obtener encuesta con resultados parciales o finales). Calcular y retornar porcentaje por opción en cada respuesta. Este único endpoint es consumido tanto por web como por móvil.

**Commit:**
`feat(polls): crear entidad Poll, PollVote y endpoints REST con validación de voto único`

**Estimación:**
5 horas

---

### 5. Título: Servicio WebSocket — Broadcasting de votos y cierre de encuesta

**Prompt Sugerido:**
En el gateway/servicio WebSocket existente del grupo, agregar los eventos de encuesta. Al registrarse un voto exitoso en `POST /api/polls/:pollId/vote`, emitir al room del grupo el evento `poll:vote_updated` con payload `{ pollId, options: [{id, text, count, percentage}] }`. Al cerrarse una encuesta (por scheduler o por expiración detectada), emitir `poll:closed` con payload `{ pollId, options: [{id, text, count, percentage}], closedAt }`. Asegurar que ambos eventos se emitan únicamente al room del grupo correspondiente (`groupId`). Usar el sistema de rooms/channels ya configurado en el Sprint 3.

**Commit:**
`feat(websocket): emitir eventos poll:vote_updated y poll:closed al room del grupo`

**Estimación:**
3 horas

---

### 6. Título: Scheduler de auto-cierre de encuesta por temporizador

**Prompt Sugerido:**
Implementar un servicio `PollSchedulerService` que al crear una encuesta (`POST /api/groups/:groupId/polls`) programe un job diferido que se ejecute exactamente en `closesAt`. El job debe: (1) actualizar el campo `status` de la encuesta a `CLOSED` en base de datos, (2) calcular los resultados finales definitivos y (3) disparar el evento WebSocket `poll:closed` a través del servicio del punto 5. Usar el mecanismo de scheduling del framework existente (por ejemplo `@nestjs/schedule` con `schedulerRegistry.addTimeout` o equivalente según stack). Si el servidor reinicia antes de `closesAt`, re-programar los jobs de encuestas con `status: ACTIVE` y `closesAt > now()` al arrancar la aplicación (`onModuleInit`).

**Commit:**
`feat(polls): implementar PollSchedulerService para auto-cierre por temporizador con recuperación al arranque`

**Estimación:**
4 horas
