## Context

El frontend web de Uniconnect fue scaffoldeado recientemente (Mayo 2026) y comparte el paquete `@uniconnect/shared` con la aplicación móvil. Sin embargo, la migración de patrones de React Native a React DOM ha dejado inconsistencias críticas:

1. **GroupDetail** accede a `groupInfo.owner.id_user` sin defensive checks, asumiendo que Prisma siempre retorna un owner. En la realidad, `owner_id` puede ser `null` (datos legacy o grupos de sistema).
2. **Notificaciones** usan una ruta completa `/notifications` rompiendo el flujo de navegación contextual. Mobile usa un tab screen; web debería usar un popover para mantener contexto.
3. **Cursos** en web usan `getByStudent()` (endpoint `/get-by-student`) que retorna cursos disponibles para inscribir, no los inscritos. Mobile usa el perfil del estudiante que incluye cursos inscritos con estado.
4. **Login** post-callback muestra un frame de "Bienvenido" porque `isLoading` se resetea en `finally` antes de que `navigate()` complete la transición de ruta.
5. **Chat** no existe en la web; el detalle de grupo solo muestra miembros sin la interfaz de mensajería que sí existe en mobile.

## Goals / Non-Goals

**Goals:**
- Eliminar el crash `Cannot read properties of null (reading 'id_user')` en GroupDetail con defensive rendering.
- Integrar interfaz de chat funcional en GroupDetail para miembros del grupo.
- Convertir notificaciones a un popover dropdown desde el Navbar, eliminando la ruta `/notifications`.
- Corregir el endpoint de cursos para mostrar inscripciones activas, separando la acción de "agregar curso" a un modal.
- Prevenir el flash de "Bienvenido" en login post-callback.

**Non-Goals:**
- No refactorizar el backend (los endpoints existen, solo se corrige el consumo).
- No implementar WebSockets en web (el chat usará polling o el mecanismo existente de messages).
- No modificar la arquitectura de stores (MobX en web ya está estable).

## Decisions

### Decision 1: Optional Chaining en GroupDetail
- **Elegido**: `groupInfo.owner?.id_user` y `groupInfo.memberships || []` con fallback a valores seguros.
- **Alternativa**: Normalizar datos en el hook `useGroupInfo`.
- **Razón**: El hook no debe asumir la estructura del backend. La defensa debe estar en el componente que consume los datos, siguiendo el principio de programación defensiva del AGENTS.md.

### Decision 2: Chat Inline en GroupDetail
- **Elegido**: Renderizar una sección de chat al final del GroupDetail cuando `isMember === true`, usando `useGroupMessages` hook y `messagesService` de `@uniconnect/shared`.
- **Alternativa**: Ruta separada `/groups/:id/chat`.
- **Razón**: Mobile muestra el chat en la misma pantalla de grupo (o navega a ChatScreen). En web, el espacio vertical permite un layout de dos columnas (info + chat) o una sección inferior expandible. Mantiene el contexto del grupo.

### Decision 3: Popover para Notificaciones
- **Elegido**: Componente `NotificationsPopover` posicionado con `position: absolute` relativo al Navbar, controlado por estado local en `Layout.tsx`.
- **Alternativa**: Usar una librería de popovers (Radix, Floating UI).
- **Razón**: El proyecto usa CSS Modules y componentes custom. Agregar una librería externa para un solo popover es overkill. El componente `NotificationCenter` ya es standalone y puede renderizarse dentro del popover.

### Decision 4: Separación de Endpoints de Cursos
- **Elegido**: `useProfile` consumirá `getOwnCourses()` para mostrar "Mis Cursos". Un nuevo modal `AddCourseModal` consumirá `getByStudent()` para listar disponibles.
- **Alternativa**: Un solo endpoint que retorne todo con flags.
- **Razón**: Los endpoints ya existen en el backend (`/get-own` y `/get-by-student`). No requiere cambios backend. La semántica actual de `/get-by-student` es útil para el modal de agregar.

### Decision 5: Estado de Carga en Login
- **Elegido**: En `useWebAuth`, cuando `exchangeAuthorizationCode` es exitoso, NO llamar `setIsLoading(false)`. La navegación a `/events` ocurrirá mientras `isLoading` sigue `true`, y `LoginScreen` mostrará el spinner.
- **Alternativa**: Agregar un estado `isRedirecting` separado.
- **Razón**: Simplifica el flujo. El spinner ya existe en `LoginScreen` (usado durante `loginWithAuth0`). Reutilizarlo evita agregar estado nuevo.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Chat inline consume mucho espacio vertical en mobile web** | El layout usará media queries para mostrar chat en una columna inferior en pantallas < 768px. |
| **Popover de notificaciones no se cierra al navegar** | El estado del popover se resetea al cambiar de ruta usando `useLocation` en `Layout.tsx`. |
| **getOwnCourses no está expuesto en CoursesService de shared** | Verificar si el método existe; si no, agregarlo al `CoursesService` en el paquete compartido antes de implementar. |
| **Cambios en router.tsx rompen bookmarks de /notifications** | La ruta se elimina; usuarios con bookmark verán 404. Se considera aceptable porque es una ruta interna de app, no pública. |

## Migration Plan

1. Implementar defensive checks en GroupDetail (cambio puro frontend, sin riesgo).
2. Agregar método `getOwnCourses` a `CoursesService` en shared si falta, rebuild shared.
3. Actualizar `useProfile` para usar nuevo endpoint.
4. Implementar popover de notificaciones y eliminar ruta.
5. Implementar chat en GroupDetail.
6. Ajustar login loader.
7. Verificar con `npx tsc --noEmit` en Frontend-web.

## Open Questions

- ¿Existe ya un hook `useGroupMessages` en Frontend-web o debe crearse desde cero?
- ¿El componente `MessageBubble` de web es compatible con el tipo `Message` de shared?
- ¿Qué estado de curso se usa en mobile? (Se observó `state?: string` en el tipo, posiblemente `"active"`, `"finished"`).
