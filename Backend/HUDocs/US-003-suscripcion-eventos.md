# US-003 — Suscripción a Categorías de Eventos Universitarios

## Historia de Usuario
Como estudiante, quiero suscribirme a categorías de eventos universitarios para recibir
notificación automática cuando se publique un nuevo evento de esa categoría.

---

## Tarea 1 — Interfaz del evento y EventoUniversidadSubject

**Prompt Sugerido:**
Crear el tipo `EventoUniversidadEvent` con los campos `tipo: 'NUEVO_EVENTO'`, `categoria: string`,
`idCategoria: number`, `evento: { id_event, title, start_date }` y `timestamp: Date`.
Luego crear `EventoUniversidadSubject` que implemente `ISubject<EventoUniversidadEvent>` siguiendo
el mismo patrón que `StudyGroupSubject` (attach/detach/notify con manejo de errores por observer).

**Commit:** `feat(events): CA1 — crear EventoUniversidadSubject e interfaz EventoUniversidadEvent`

**Estimación:** 0.5 h

---

## Tarea 2 — Observer que filtra por categoría antes de emitir WebSocket

**Prompt Sugerido:**
Crear `EventPublishedObserver` que implemente `IObserver<EventoUniversidadEvent>`.
En el método `update()`: si `event.tipo !== 'NUEVO_EVENTO'` retornar. De lo contrario,
llamar `prisma.event_category_subscription.findMany({ where: { id_category: event.idCategoria } })`
y luego `notificationsService.enviarNotificacion()` para cada suscriptor. Usar fire-and-forget con `.catch()`.

**Commit:** `feat(events): CA4 — EventPublishedObserver filtra suscriptores por categoría antes de emitir WebSocket`

**Estimación:** 1 h

---

## Tarea 3 — Refactorizar EventsService para usar el Subject

**Prompt Sugerido:**
En `EventsService.createEvent()`, reemplazar la llamada a `eventEmitter.emit(MESSAGE_EVENTS.EVENT_PUBLISHED, ...)`
por `eventoUniversidadSubject.notify({ tipo: 'NUEVO_EVENTO', categoria, idCategoria, evento, timestamp })`.
Eliminar la consulta de suscriptores del servicio (el observer la hace). Inyectar `EventoUniversidadSubject`
y remover `EventEmitter2` del constructor.

**Commit:** parte del commit `feat(events): CA2/CA3 — endpoints /eventos/suscribir y flujo Observer completo`

**Estimación:** 0.5 h

---

## Tarea 4 — Endpoints POST /eventos/suscribir y DELETE /eventos/suscribir

**Prompt Sugerido:**
En `EventsController`, agregar:
- `@Post('eventos/suscribir')` que toma `id_category` del body vía `@Body('id_category', ParseIntPipe)`
- `@Delete('eventos/suscribir')` con la misma firma
Ambos delegan a `eventsService.subscribeCategory()` y `unsubscribeCategory()` respectivamente.
Mantener los endpoints originales `/events/categories/:categoryId/subscribe` como aliases.

**Commit:** parte del commit `feat(events): CA2/CA3 — endpoints /eventos/suscribir y flujo Observer completo`

**Estimación:** 0.5 h

---

## Tarea 5 — Conectar Subject y Observer en EventsModule

**Prompt Sugerido:**
Implementar `EventsModule` con `OnModuleInit`. En `onModuleInit()` adjuntar el observer al subject:
`this.subject.attach(this.eventPublishedObserver)`. Importar `NotificationsModule` para que
`NotificationsService` sea inyectable en el observer. Registrar `EventoUniversidadSubject`
y `EventPublishedObserver` como providers.

**Commit:** parte del commit `feat(events): CA2/CA3 — endpoints /eventos/suscribir y flujo Observer completo`

**Estimación:** 0.5 h
