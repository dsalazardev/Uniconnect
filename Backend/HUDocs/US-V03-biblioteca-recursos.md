# US-V03 — Biblioteca Colaborativa de Recursos con Patrón Decorator

## Historia de Usuario
Como estudiante, quiero una biblioteca colaborativa de recursos con un nuevo caso de Decorator con tres variantes, extracción Open Graph, permisos diferenciados y acceso desde web y móvil.

---

## Tarea 1 — Schema Prisma y migración SQL

**Prompt Sugerido:**
Crear `Backend/prisma/schema/resource.prisma` con los modelos `resource`, `resource_tag`, `resource_rating` y `resource_comment`. Enum `TipoContenido`: ENLACE, DOCUMENTO, VIDEO, IMAGEN, ARTICULO, OTRO. Agregar back-relations en `group.prisma` y `user.prisma`. Crear migración manual en `prisma/migrations/20260516000000_add_resources/migration.sql` y regenerar cliente con `npx prisma generate`.

**Commit:** `chore(db): schema Prisma y migración para biblioteca de recursos`

**Estimación:** 1 h

---

## Tarea 2 — Patrón Decorator: IRecurso y tres decoradores (CA2/CA7)

**Prompt Sugerido:**
Crear `Backend/src/resources/domain/decorator/recurso.interface.ts` con `IRecurso` (getContenido() + getMetadata()), compatible estructuralmente con `IMessage` del Sprint 3 (CA7). Crear `RecursoBase` como componente concreto, `RecursoDecorator` como abstract, y tres decoradores concretos: `RecursoConEtiquetas` (agrega etiquetas[]), `RecursoConValoracion` (agrega promedio y total), `RecursoConComentarios` (agrega lista de comentarios). Todos extienden `RecursoDecorator` y son composables entre sí.

**Commit:** `feat(resources): CA2/CA7 — patrón Decorator con IRecurso, RecursoBase y tres decoradores`

**Estimación:** 1.5 h

---

## Tarea 3 — OpenGraphService: extracción automática de metadatos (CA1)

**Prompt Sugerido:**
Crear `Backend/src/resources/services/open-graph.service.ts`. Usar axios para hacer GET a la URL externa con timeout 5 s y User-Agent propio. Extraer `og:title`, `og:description`, `og:image` mediante regex. Fall-back: si og:title no existe usar `<title>`; si la extracción falla, retornar la URL como título sin lanzar excepción.

**Commit:** `feat(resources): CA1 — OpenGraphService extrae título, descripción e imagen de URL externa`

**Estimación:** 1 h

---

## Tarea 4 — ResourcesModule: DTOs, Service y Controller (CA1/CA3/CA4)

**Prompt Sugerido:**
Crear DTOs (CreateResourceDto, UpdateResourceDto, AddCommentDto, RateResourceDto) con class-validator. Implementar `ResourcesService` con métodos: `crearRecurso` (valida membresía, llama OpenGraphService, persiste), `listarRecursos` (filtro por `tipo_contenido`), `editarRecurso`/`eliminarRecurso` (verifican `created_by === userId` O `membership.is_admin` para CA3), `agregarComentario`, `valorarRecurso`. El método `buildResponse()` aplica los decoradores encadenados y retorna `decoradores: getMetadata()`. Crear `ResourcesController` bajo `groups/:groupId/recursos`. Registrar `ResourcesModule` en `AppModule`.

**Commit:** `feat(resources): CA1/CA3/CA4 — ResourcesModule completo con permisos diferenciados`

**Estimación:** 2 h

---

## Tarea 5 — Shared package: tipos, endpoints y ResourcesService

**Prompt Sugerido:**
Crear `Frontend/shared/src/types/resources.ts` (Resource, ResourceDecorators, CreateResourcePayload, UpdateResourcePayload, TipoContenido). Crear `Frontend/shared/src/api/endpoints/resources.ts` con RESOURCES_ENDPOINTS. Crear `Frontend/shared/src/services/resources.service.ts` con todos los métodos HTTP. Exportar desde los barrel files index.ts.

**Commit:** `feat(shared): tipos, endpoints y ResourcesService para biblioteca de recursos`

**Estimación:** 0.5 h

---

## Tarea 6 — Frontend Web: ResourceLibrary en panel de grupo (CA5)

**Prompt Sugerido:**
Crear `Frontend/Frontend-web/src/features/groups/components/ResourceLibrary.tsx`. Toolbar con select de filtro por tipo y botón "Agregar". Grid de tarjetas que muestran: imagen Open Graph (`imagen_preview`), título extraído, badge de tipo, etiquetas (decorador), valoración promedio (decorador), conteo de comentarios (decorador). Modal para crear recurso (URL, título, tipo, etiquetas). Botón eliminar visible solo para `created_by === currentUserId` o `isOwner`. Integrar en sección del `infoPanelContent` de `GroupDetail.tsx`.

**Commit:** `feat(web): CA5 — ResourceLibrary en panel de grupo con OG, título y decoradores activos`

**Estimación:** 1.5 h

---

## Tarea 7 — Frontend Mobile: ResourceLibrary en GroupInfoModal (CA6)

**Prompt Sugerido:**
Crear `Frontend/Frontend-mobile/src/features/groups/components/ResourceLibrary.tsx` con el mismo flujo que la versión web. Usar `FlatList` para recursos, `ScrollView` horizontal para chips de filtro y Modal bottom-sheet para crear recurso. Imagen OG con `Image`, enlace con `Linking.openURL`. Integrar en `GroupInfoModal.tsx` como sección "Biblioteca de recursos". Reutilizar `ResourcesService` del shared package para garantizar los mismos endpoints (CA6).

**Commit:** `feat(mobile): CA6 — ResourceLibrary en GroupInfoModal con OG, filtro y mismos endpoints`

**Estimación:** 1.5 h
