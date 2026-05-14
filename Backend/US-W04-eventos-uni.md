# US-W04 · Gestor de eventos universitarios por categoría

---

## FRONTEND

### 1. Dashboard de eventos con grid de categorías y filtro

**Prompt Sugerido:**
Crea `Frontend-web/src/features/events/components/EventsDashboard.tsx` y su archivo de estilos `EventsDashboard.module.css`. El componente debe consumir `GET /categories` al montar para renderizar las categorías disponibles como chips filtrables (académico, cultural, deportivo, etc.). Al seleccionar una categoría, llama `GET /events?categoryId=<id>` y muestra únicamente los eventos de esa categoría en un grid de tarjetas. Cada tarjeta debe mostrar: título, fecha de inicio, lugar y un badge de estado con colores distintos (UPCOMING = dorado, ONGOING = verde, FINISHED = gris). Incluye estado de carga (`Cargando eventos...`), estado vacío (`No hay eventos en esta categoría`) y manejo de error. Usa la paleta del proyecto (`#1a1a1a`, `#D9B97E`). Registra la ruta `/events` en el router existente.

**Commit:**
`feat(events): implementar dashboard de eventos con filtro por categoría`

**Estimación:**
2 horas

---

### 2. Suscripción/des-suscripción a categorías y listener Observer WebSocket

**Prompt Sugerido:**
En `EventsDashboard.tsx`, agrega un ícono de suscripción (campana) en cada chip de categoría. Al activarlo llama `POST /events/categories/:categoryId/subscribe` y al desactivarlo `DELETE /events/categories/:categoryId/subscribe`. Al montar el componente, recupera el estado inicial con `GET /events/categories/subscriptions` y marca los chips suscritos visualmente. Llama `websocketService.connect()` antes de registrar listeners (mismo patrón del foro en el proyecto — ver `ForumDashboard.tsx`). Registra `websocketService.on('event:published', handler)` donde el handler: (1) muestra un toast con el título del evento publicado, (2) si la `categoryId` del evento coincide con la categoría activa, hace prepend del nuevo evento a la lista. Al desmontar, llama `websocketService.off('event:published', handler)` y limpia el reconnect callback.

**Commit:**
`feat(events): agregar suscripción a categorías y Observer WebSocket de nuevos eventos`

**Estimación:**
2 horas

---

## BACKEND

### 3. Modelos Prisma y endpoints REST de eventos y categorías

**Prompt Sugerido:**
En `Backend/prisma/schema/`, crea `event.prisma` con los siguientes modelos: `event_category` (`id_category` Int PK autoincrement, `name` VarChar(100), `color` VarChar(20)) y `event` (`id_event` Int PK autoincrement, `id_category` Int FK → event_category, `title` VarChar(300), `description` VarChar(2000), `location` VarChar(300), `start_date` Timestamptz, `end_date` Timestamptz, `status` Enum `UPCOMING / ONGOING / FINISHED / CANCELLED` default UPCOMING, `created_by` Int FK → user, `created_at` Timestamptz default now()). Ejecuta `prisma migrate dev`. Crea `Backend/src/events/` con `EventsModule`, `EventsController` y `EventsService`. Implementa los endpoints: `GET /categories`, `GET /events` (acepta query param opcional `?categoryId=`), `GET /events/:id`, `POST /events` (solo usuarios autenticados, recibe `CreateEventDto`). Protege todos los endpoints con `JwtAuthGuard`. Registra `EventsModule` en `AppModule`.

**Commit:**
`feat(events): crear modelos Prisma y endpoints REST de eventos y categorías`

**Estimación:**
1 hora

---

### 4. Suscripciones a categorías y patrón Observer via WebSocket

**Prompt Sugerido:**
En `event.prisma`, añade el modelo `event_category_subscription` (`id_subscription` Int PK autoincrement, `id_user` Int FK → user, `id_category` Int FK → event_category, `created_at` Timestamptz default now(), `@@unique([id_user, id_category])`). Ejecuta `prisma migrate dev`. En `EventsController` agrega los endpoints: `POST /events/categories/:categoryId/subscribe`, `DELETE /events/categories/:categoryId/subscribe` y `GET /events/categories/subscriptions` (devuelve array de `id_category` suscritos del usuario autenticado). En `EventsService` implementa `subscribeCategory`, `unsubscribeCategory` y `getSubscriptions`. En el método `createEvent`, tras persistir el evento en BD, consulta todos los registros de `event_category_subscription` donde `id_category` coincida y emite `event:published` a cada usuario suscrito mediante `MessagesGateway`. Si no existe `sendToUser(userId, event, data)` en el gateway, impleméntalo como `this.server.to(\`user-\${userId}\`).emit(event, data)` y asegúrate de que en `handleAuthenticate` el socket haga `client.join(\`user-\${userId}\`)` además del join de grupo.

**Commit:**
`feat(events): implementar suscripciones a categorías y Observer WebSocket de publicación`

**Estimación:**
5 horas
