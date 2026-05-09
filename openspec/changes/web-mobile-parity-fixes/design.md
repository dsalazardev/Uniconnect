## Context

Frontend-web utiliza React Query para gestión de estado servidor y MobX para estado global (auth, notificaciones). Se identificaron 4 brechas de paridad con Frontend-mobile donde la implementación web falla en comportamiento reactivo, distinción de tipos de chat, flujo de salida de grupo como owner, y estilo visual del badge de notificaciones. Estos problemas fueron detectados mediante análisis comparativo directo del código fuente de ambos frontends.

**Estado actual relevante:**
- `useProfile.ts` usa `queryKey: ['my-courses']` mientras `useStudentCourses.ts` usa `queryKey: ['courses']`, creando dos cachés desconectadas.
- `GroupDetail.tsx` no lee `is_direct_message`; siempre renderiza título "Detalle del Grupo", lista de miembros y chat grupal.
- `GroupDetail.tsx` oculta el botón "Salir" para owners (`!isOwner`), impidiendo el flujo de transferencia obligatoria.
- `Layout.tsx` implementa un badge dorado inline en lugar de usar el componente `NotificationBadge.tsx` existente.
- Mobile ya tiene implementaciones completas y funcionales de todos estos patrones (`TransferOwnershipModal`, `PendingTransferOwnerBanner`, `NotificationIcon` con badge dorado/rojo, etc.).

## Goals / Non-Goals

**Goals:**
1. Unificar invalidación de caché React Query para operaciones de cursos en web.
2. Detectar y adaptar UI de `GroupDetail` según `is_direct_message`.
3. Implementar flujo de transferencia de propiedad al salir de grupo como owner.
4. Actualizar badge de notificaciones a estilo YouTube (rojo, compacto, sobre icono).

**Non-Goals:**
- No modificar backend (APIs, base de datos, guards).
- No modificar Frontend-mobile.
- No crear tests unitarios (pero el código debe ser compatible con `vitest`).
- No cambiar paleta de colores global ni sistema de diseño completo.

## Decisions

**1. Estrategia de unificación de queryKeys: Estandarizar en `['courses']` e invalidar `['my-courses']` desde mutaciones**
- *Rationale*: `useStudentCourses.ts` es el hook especializado para operaciones CRUD de cursos. `useProfile.ts` solo lee cursos como parte del perfil. Es más limpio que el hook especializado mantenga su queryKey y que las mutaciones invaliden ambas cachés. Esto evita romper el contrato de `useProfile`.
- *Alternativa considerada*: Unificar ambas en un solo hook compartido. Rechazada porque `useProfile` es un hook de perfil genérico y `useStudentCourses` es específico de cursos; acoplarlos generaría una dependencia innecesaria.

**2. Lógica de DM vs Grupo: Centralizar en `GroupDetail.tsx` con derived state**
- *Rationale*: El componente ya carga `groupInfo` completo. Derivar `isDirectMessage` y `otherUserName` desde `groupInfo` en el componente es el punto más simple de intervención sin modificar `useChat` ni `useGroupInfo`.
- *Alternativa considerada*: Crear un hook `useChatDuality`. Rechazada porque agrega indirección innecesaria; la lógica es trivial (leer un booleano y filtrar miembros).

**3. Transferencia de propiedad: Modal inline en `GroupDetail` + reutilizar `GroupAdminPanel` donde aplique**
- *Rationale*: Mobile usa `TransferOwnershipModal` como componente separado. En web, `GroupAdminPanel.tsx` YA tiene `handleTransferOwnership` (líneas 88-100). La brecha no es la función, es el flujo de salida. Se creará un modal de transferencia reutilizable (`TransferOwnershipModal.tsx`) que se dispara desde el botón de salir del owner.
- *Alternativa considerada*: Extender `ConfirmModal` genérico. Rechazada porque seleccionar un miembro requiere UI de lista con radio buttons, demasiado específico para un modal genérico.

**4. Badge de notificaciones: Usar `NotificationBadge.tsx` existente + ajustar CSS**
- *Rationale*: El componente ya está implementado, es `observer()` de MobX, y tiene CSS module separado. Solo necesita cambio de color y ser integrado en `Layout.tsx`.
- *Alternativa considerada*: Implementar badge inline en `Layout.tsx`. Rechazada porque ya existe un componente dedicado que sigue la arquitectura del proyecto (MobX + CSS Modules).

## Risks / Trade-offs

- **[Risk] `ProfileScreen` usa `observer()` de MobX pero cursos vienen de React Query** → Mitigation: La re-renderización se maneja por invalidación de RQ, no MobX. `observer()` sigue siendo útil para `authStore.user`.
- **[Risk] `useDirectMessage.ts` tiene TODO sin implementar** → Mitigation: Completar la navegación con `useNavigate()` de React Router. Validar que el `groupId` retornado exista antes de navegar.
- **[Risk] `pending_owner_id` puede no estar incluido en la respuesta de `getGroupInfo` del backend** → Mitigation: Verificar el tipo `GroupInfo` en `@uniconnect/shared` y tipos locales. Si no existe, requerirá modificación del backend (marcado como posible scope creep, pero según AGENTS.md, `pending_owner_id` ya existe en mobile).
- **[Risk] Layout responsive: quitar texto "Notificaciones" puede reducir accesibilidad** → Mitigation: Mantener `aria-label="Notificaciones"` en el botón contenedor.
- **[Trade-off] `TransferOwnershipModal` duplica lógica de selección de miembros** → Aceptado: Mobile ya tiene este componente; web necesita su versión DOM. No se extrae a shared porque es UI específica de plataforma.

## Migration Plan

No se requiere migración de datos ni de estado. Los cambios son puros de UI/UX. Despliegue:
1. Merge de la rama.
2. Build de producción `npm run build:web`.
3. Deploy estático (Vite produce assets estáticos).
4. Rollback: revert del commit.

## Open Questions

1. ¿El backend retorna `pending_owner_id` en `getGroupInfo` para el frontend web? (Se asume sí, ya que mobile lo usa).
2. ¿Existe algún grupo en producción donde `is_direct_message=true` y NO tenga exactamente 2 miembros? (Escenario de borde: validar en pruebas manuales).
