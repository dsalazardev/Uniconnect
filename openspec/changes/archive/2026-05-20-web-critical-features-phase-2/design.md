## Context

La auditoría comparativa entre Frontend-mobile y Frontend-web reveló que Web tiene múltiples componentes "muertos" (built pero no wireados), stubs en lugar de funcionalidad real, y rutas faltantes. Estos problemas fueron clasificados por prioridad: P0 (bloqueantes), P1 (features rotas) y P2 (mejoras). Este change aborda todo P0 y la mayoría de P1. No requiere cambios de backend ni de arquitectura; se trata de exponer y conectar funcionalidad que ya existe en hooks y componentes pero que no está integrada en la UI.

## Goals / Non-Goals

**Goals:**
1. Registrar onboarding en el router para que usuarios nuevos puedan completar registro.
2. Integrar `GroupAdminPanel` en `GroupDetail` para que owners gestionen miembros y solicitudes.
3. Activar edición de grupos en `GroupsPage` (reemplazar stub por modal real).
4. Implementar navegación desde notificaciones a las rutas correspondientes.
5. Activar listado de conexiones aceptadas (mis amigos) descomentando endpoint y agregando UI.
6. Agregar botones de editar/eliminar mensajes en el chat.
7. Conectar file upload al input de mensajes.

**Non-Goals:**
- No agregar nuevos endpoints backend.
- No modificar Frontend-mobile.
- No implementar push notifications web (service worker).
- No modificar el diseño visual global (solo integrar componentes existentes).

## Decisions

**1. Reutilizar componentes existentes en lugar de crear nuevos**
- *Rationale:* `GroupAdminPanel`, `TransferOwnershipModal`, `PendingTransferOwnerBanner`, `EditGroupModal`, `FilePickerModal`, y hooks `editMessage`/`deleteMessage` ya existen. El trabajo es conectarlos, no reescribirlos.
- *Alternativa considerada:* Crear versiones web-specific de cada componente. Rechazada porque duplicaría código innecesariamente.

**2. Router: onboarding como ruta protegida condicional**
- *Rationale:* El onboarding debe ser accesible solo para usuarios autenticados con `needsOnboarding === true`. No debe ser pública ni requerir auth de nuevo.
- *Implementación:* Ruta `/onboarding` con guard que redirige a `/events` si `needsOnboarding === false`.

**3. GroupAdminPanel: renderizado condicional en GroupDetail**
- *Rationale:* El panel de admin solo es relevante cuando el usuario es owner (`isOwner === true`).
- *Implementación:* Insertar `<GroupAdminPanel>` en `GroupDetail` después del banner de transferencia pendiente, solo cuando `isOwner && !isDirectMessage`.

**4. Notification navigation: switch por `notification_type`**
- *Rationale:* Las notificaciones del backend incluyen `notification_type` (ej. `GROUP_INVITATION`, `EVENT_REMINDER`, `JOIN_REQUEST`).
- *Implementación:* Mapear cada tipo a una ruta (`/groups/:id`, `/events/:id`, `/chat/:id`) y navegar con `useNavigate()`.

**5. Message actions: menú contextual tipo dropdown**
- *Rationale:* Mobile usa "tap largo" que no existe en web. Un dropdown (tres puntos o click derecho) es el patrón web estándar.
- *Implementación:* Pequeño botón de "more actions" en cada mensaje propio que abre un mini-menú con "Editar" y "Eliminar".

## Risks / Trade-offs

- **[Risk] `GroupAdminPanel` fue construido con props específicas que pueden no coincidir con `GroupDetail`** → Mitigation: Verificar la interfaz de props de `GroupAdminPanel` antes de integrar. Ajustar si es necesario.
- **[Risk] `useConnections` endpoint comentado (`myConnections`) puede no funcionar si el backend cambió** → Mitigation: Validar que `GET /connections/accepted` (o endpoint equivalente) aún existe antes de descomentar.
- **[Risk] File upload en chat requiere manejo de S3 presigned URLs** → Mitigation: `files.service.ts` ya existe en web. Solo wirear el flujo de selección → upload → envío de mensaje con archivos.
- **[Risk] OnboardingScreen puede esperar props o contexto que no están en web** → Mitigation: `OnboardingScreen` ya es un componente React. Revisar si usa algún hook nativo de mobile (ej. `expo-image-picker`) antes de exponerlo en web.

## Migration Plan

No se requiere migración de datos. Despliegue: merge, build (`npm run build:web`), deploy estático. Rollback: revert commit.

## Open Questions

1. ¿El endpoint `/connections/accepted` (o similar) existe en backend? (En mobile se usa `getMyConnections`).
2. ¿`OnboardingScreen` usa algún componente nativo de Expo que rompa en web?
3. ¿El backend envía `related_entity_id` y `notification_type` en todas las notificaciones?
