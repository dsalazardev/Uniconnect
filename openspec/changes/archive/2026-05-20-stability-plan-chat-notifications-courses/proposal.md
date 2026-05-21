## Why

El frontend web de Uniconnect presenta múltiples puntos de falla críticos que degradan la experiencia del usuario: un crash recurrente al navegar al detalle de grupos desde perfiles de estudiante, una navegación de notificaciones poco práctica (página completa en lugar de popover), un endpoint de cursos invertido que muestra materias disponibles en lugar de inscritas, y un flash de contenido no deseado durante el flujo de login post-callback. Estos errores rompen la paridad funcional con la aplicación móvil y bloquean flujos esenciales de uso diario.

## What Changes

- **Fix crash en GroupDetail**: Agregar defensive checks (`optional chaining`) para `groupInfo.owner` y `groupInfo.memberships` para evitar null-reference crashes cuando el backend retorna grupos sin owner asignado.
- **Chat funcional en GroupDetail**: Integrar la interfaz de mensajería (lista de mensajes + input de envío) dentro del detalle de grupo, visible solo cuando el usuario autenticado es miembro del grupo (`isMember === true`). Incluye botón para abandonar el grupo.
- **Notificaciones como Popover**: Convertir el centro de notificaciones de una ruta de página completa (`/notifications`) a un dropdown/overlay desplegable desde el ícono de campana en el Navbar, sin cambiar de URL.
- **Fix endpoint de cursos**: Corregir `useProfile.ts` para usar el endpoint `/courses/get-own` (cursos inscritos del estudiante) en lugar de `/courses/get-by-student` (cursos disponibles para inscribir). Separar la vista de "Mis Cursos" (inscritos) de "Agregar curso" (disponibles) con un modal de selección.
- **Login Loader**: Eliminar el flash de la pantalla "Bienvenido" post-autenticación manteniendo el estado de carga (`isLoading`) activo hasta que la navegación a `/events` se complete.

## Capabilities

### New Capabilities
- `group-chat-integration`: Integración de interfaz de mensajería en el detalle de grupo, con detección de membresía y botón de abandonar grupo.
- `notifications-popover`: Centro de notificaciones como overlay dropdown en el Navbar, con manejo de click-outside y estado local de visibilidad.
- `course-enrollment-separation`: Separación clara entre endpoint de cursos inscritos (`/get-own`) y endpoint de cursos disponibles (`/get-by-student`), con UI de modal para agregar nuevos cursos.

### Modified Capabilities
- `group-detail-rendering`: Defensive rendering en GroupDetail y MemberList para manejar datos null del backend (owner ausente, memberships vacíos).
- `auth-callback-flow`: Control de estado de carga durante el flujo de callback de Auth0 para evitar renders intermedios no deseados.

## Impact

- **Frontend-web**: `GroupDetail.tsx`, `MemberList.tsx`, `Layout.tsx`, `NotificationCenter.tsx`, `ProfileScreen.tsx`, `useProfile.ts`, `CourseList.tsx`, `useStudentCourses.ts`, `useWebAuth.ts`, `LoginScreen.tsx`, `router.tsx`.
- **Shared Package**: Posiblemente `CoursesService` para exponer `getOwnCourses` si aún no está disponible.
- **UX**: Elimina 4 bugs críticos, mejora paridad con mobile, reduce navegación innecesaria.
