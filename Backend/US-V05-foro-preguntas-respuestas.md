# US-V05 — Foro de Preguntas y Respuestas por Asignatura

---

## FRONTEND

### 1. Título: SHARED — Tipos, endpoints y ForumService reutilizable

**Prompt Sugerido:**
En el módulo `shared/` implementar toda la capa reutilizable del foro:

1. **Tipos (`shared/src/types/forum.ts`):** Definir las interfaces `ForumQuestion` (id, subjectId, authorId, title, body, status: `'OPEN' | 'RESOLVED'`, voteCount, createdAt), `ForumAnswer` (id, questionId, authorId, body, voteCount, isAccepted, createdAt), y los DTOs `CreateQuestionDto` (title, body), `CreateAnswerDto` (body), `VoteDto` (entityType: `'QUESTION' | 'ANSWER'`, entityId).

2. **Endpoints (`shared/src/api/endpoints/forum.ts`):** Constantes para: `GET /subjects/:subjectId/forum/questions`, `POST /subjects/:subjectId/forum/questions`, `GET /forum/questions/:questionId/answers`, `POST /forum/questions/:questionId/answers`, `POST /forum/questions/:questionId/vote`, `POST /forum/answers/:answerId/vote`, `PATCH /forum/answers/:answerId/accept`.

3. **ForumService (`shared/src/services/forum.service.ts`):** Clase que recibe un `AxiosInstance` e implementa un método por endpoint. Exportar todo desde `shared/src/index.ts`.

**Commit:**
`feat(shared): agregar tipos, endpoints y ForumService reutilizable para el foro`

**Estimación:**
2 horas

---

### 2. Título: Web Dashboard — Vista del foro con preguntas, votos y respuesta aceptada

**Prompt Sugerido:**
En el dashboard web (`Frontend/Frontend-web/src/features/forum/`), implementar la vista completa del foro:

1. **`hooks/useForum.ts`:** Hook que carga preguntas del subject (`ForumService.getQuestions`), expone `createQuestion`, `createAnswer` y `castVote` con optimistic UI. Suscribirse a los eventos WebSocket `forum:vote_updated` y `forum:answer_accepted` para actualizar el estado local sin refetch ni polling.
2. **`components/ForumScreen.tsx`:** Lista de preguntas ordenadas por `voteCount` descendente. Cada ítem muestra título, conteo de votos y badge de estado (`ABIERTA` / `RESUELTA`). Botón "Nueva pregunta" abre `QuestionCreationModal`.
3. **`components/QuestionDetail.tsx`:** Detalle con lista de respuestas. La respuesta con `isAccepted: true` se fija visualmente al tope con badge "Aceptada" independientemente de votos. Las demás se ordenan por `voteCount` descendente. Botón "Aceptar respuesta" visible solo para el docente (verificar rol desde el contexto de auth).
4. **`components/QuestionCreationModal.tsx`:** Formulario con campos título y cuerpo que invoca `ForumService.createQuestion`.

Usar los mismos tokens de diseño del chat (colores, tipografía, estilos de burbuja).

**Commit:**
`feat(web): implementar vista del foro con preguntas, votos y respuesta aceptada`

**Estimación:**
1 horas

---

### 3. Título: Mobile Dashboard — Pantalla del foro con mismos endpoints que web

**Prompt Sugerido:**
En el dashboard móvil (`Frontend/Frontend-mobile/src/features/forum/`), implementar la pantalla del foro consumiendo los mismos endpoints del backend que la versión web:

1. **`services/index.ts`:** Instanciar `ForumService` del shared con el `api` axios de mobile (mismo patrón que `pollService`).
2. **`hooks/useForum.ts`:** Hook análogo al de web con carga de preguntas, `createQuestion`, `createAnswer`, `castVote` optimista y listeners WebSocket `forum:vote_updated` y `forum:answer_accepted`.
3. **`components/ForumScreen.tsx`:** `FlatList` de preguntas ordenadas por `voteCount` descendente. Cada ítem muestra título, badge de estado (`ABIERTA` / `RESUELTA`) y conteo de votos. Botón "+" navega a `QuestionCreationModal`.
4. **`components/QuestionCreationModal.tsx`:** `Modal` nativo bottom-sheet con `TextInput`s de título (max 300) y cuerpo (max 2000), botones Cancelar / Crear. Estilo `#1e1e1e` consistente con `PollCreationModal`. Invoca `useForum.createQuestion` y cierra el modal al completar.
5. **`components/QuestionDetail.tsx`:** `FlatList` de respuestas con la aceptada fijada al tope con badge "Aceptada". Las demás ordenadas por `voteCount` descendente. `TouchableOpacity` de voto con feedback háptico. Botón "Aceptar respuesta" visible solo para el docente.

No duplicar lógica de negocio: toda la validación y transformación de datos viene del hook `useForum`.

**Commit:**
`feat(mobile): implementar pantalla del foro usando ForumService compartido`

**Estimación:**
1 horas

---

## BACKEND

### 4. Título: Modelo Prisma, módulo NestJS y endpoints REST del foro

**Prompt Sugerido:**
Crear el esquema de base de datos y los endpoints REST del foro:

1. **`Backend/prisma/schema/forum.prisma`:** Modelos `forum_question` (id_question, id_subject FK→subject, id_membership FK→membership, title VarChar(300), body VarChar(2000), status enum `OPEN|RESOLVED` default OPEN, vote_count Int default 0, created_at), `forum_answer` (id_answer, id_question FK, id_membership FK, body VarChar(2000), vote_count Int default 0, is_accepted Boolean default false, created_at), `forum_vote` (id_vote, id_user FK, entity_type enum `QUESTION|ANSWER`, entity_id Int, created_at; constraint `@@unique([id_user, entity_type, entity_id])`).

2. **`Backend/src/forum/`:** Crear `ForumModule`, `ForumController` con rutas `GET /subjects/:subjectId/forum/questions`, `POST /subjects/:subjectId/forum/questions`, `GET /forum/questions/:questionId/answers`, `POST /forum/questions/:questionId/answers`, `PATCH /forum/answers/:answerId/accept` (solo docente via `@GetClaim`). `ForumService` con lógica de persistencia Prisma y ordenamiento en `getAnswers`: `is_accepted DESC`, `vote_count DESC`, `created_at ASC`. DTOs con `class-validator`. Ejecutar `prisma migrate dev --name add_forum`.

**Commit:**
`feat(forum): agregar schema Prisma, ForumModule y endpoints REST del foro`

**Estimación:**
1.5 horas

---

### 5. Título: Cadena CoR independiente — IManejadorPregunta con validación de matrícula

**Prompt Sugerido:**
En `Backend/src/forum/domain/chain-of-responsibility/` implementar la CoR del foro completamente independiente de la CoR de mensajes del Sprint 3:

1. **`interfaces/i-manejador-pregunta.ts`:** Interfaz `IManejadorPregunta` con métodos `manejar(pregunta: PreguntaDto): ResultadoValidacion` y `setSiguiente(manejador: IManejadorPregunta): IManejadorPregunta`.
2. **`manejador-pregunta.abstract.ts`:** Clase abstracta `ManejadorPreguntaBase` que implementa `setSiguiente` almacenando la referencia al siguiente eslabón y un método `manejar` que delega si la validación propia pasa.
3. **Handlers concretos:** `ValidacionMatriculaHandler` (verifica que el `id_membership` existe y pertenece al subject; lanza `ForbiddenException` con mensaje `"Se requiere matrícula en la asignatura"` si no), `ValidacionContenidoHandler` (verifica que title y body no estén vacíos ni superen los límites definidos en el DTO), `ValidacionEstadoGrupoHandler` (verifica que el subject esté activo).
4. **Construcción de la cadena en `ForumService.createQuestion`:** `matricula → contenido → estadoGrupo → persistir`.
5. **Test unitario `__tests__/forum-cor.spec.ts`:** Verificar que un usuario no matriculado recibe `ForbiddenException` sin llegar al handler de contenido.

**Commit:**
`feat(forum): implementar CoR independiente con IManejadorPregunta y validación de matrícula`

**Estimación:**
2 horas

---

### 6. Título: Sistema de votos con reordenamiento dinámico y eventos WebSocket

**Prompt Sugerido:**
En `Backend/src/forum/` implementar el sistema de votos y broadcasting en tiempo real:

1. **Endpoints de voto:** `POST /forum/questions/:questionId/vote` y `POST /forum/answers/:answerId/vote` en `ForumController`. En `ForumService.castVote`: insertar en `forum_vote` (lanzar `ConflictException` 409 si viola `@@unique`), recalcular `vote_count` con `count()` de Prisma, actualizar el campo en la entidad y emitir evento WebSocket.
2. **Gateway/room del foro:** En `MessagesGateway` (o un `ForumGateway` dedicado) agregar `sendToSubjectRoom(subjectId, event, data)` que emite al room `subject-{subjectId}`. Los clientes se unen al room al abrir el foro.
3. **Eventos WebSocket:** `forum:vote_updated` con payload `{ entityType, entityId, voteCount }` al registrar un voto. `forum:answer_accepted` con payload `{ questionId, answerId }` al ejecutar `PATCH /forum/answers/:answerId/accept`; este endpoint también actualiza `is_accepted = true` en la respuesta y `status = 'RESOLVED'` en la pregunta padre.
4. Garantizar que el ordenamiento en `ForumService.getAnswers` sea siempre: `is_accepted DESC`, `vote_count DESC`, `created_at ASC`.

**Commit:**
`feat(forum): agregar endpoints de votos, eventos WebSocket y fijado de respuesta aceptada`

**Estimación:**
2 horas
