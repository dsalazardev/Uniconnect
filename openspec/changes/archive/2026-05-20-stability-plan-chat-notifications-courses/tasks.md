## 1. Defensive Fixes en GroupDetail y MemberList

- [x] 1.1 Agregar optional chaining (`?.`) en `GroupDetail.tsx` L83 para `groupInfo.owner?.id_user` con fallback a `undefined`
- [x] 1.2 Agregar fallback `groupInfo.memberships || []` en `GroupDetail.tsx` L81 antes de pasar a `MemberList`
- [x] 1.3 Verificar que `MemberList.tsx` maneja `memberships.length === 0` sin crash (ya existe, confirmar)
- [x] 1.4 Verificar que `MemberList.tsx` maneja `ownerId === undefined` en L62 (badge Owner no se muestra si falta)

## 2. Chat Funcional en GroupDetail

- [x] 2.1 Crear hook `useGroupMessages(groupId: number)` en `Frontend-web/src/features/messages/hooks/` (o reutilizar existente)
- [x] 2.2 Implementar carga de mensajes via `messagesService.getGroupMessages(groupId)`
- [x] 2.3 Implementar envío de mensajes via `messagesService.sendMessage(groupId, text)` con refresco de lista
- [x] 2.4 Agregar sección de chat en `GroupDetail.tsx` condicional a `groupInfo.isMember === true`
- [x] 2.5 Estilizar chat con CSS Module: lista scrollable + input sticky al fondo
- [x] 2.6 Manejar estado vacío: "No hay mensajes aún" cuando la lista está vacía

## 3. Botón Abandonar Grupo

- [x] 3.1 Agregar botón "Abandonar Grupo" en `GroupDetail.tsx` visible solo para miembros no-owner
- [x] 3.2 Implementar confirmación con `ConfirmModal` existente antes de ejecutar leave
- [x] 3.3 Integrar `useLeaveGroup` hook para llamar `groupsService.leaveGroup(groupId)`
- [x] 3.4 Redirigir a `/groups` tras abandonar exitosamente

## 4. Notificaciones Popover

- [x] 4.1 Crear componente `NotificationsPopover.tsx` en `Frontend-web/src/components/` (wrapper posicionado absoluto)
- [x] 4.2 Renderizar `<NotificationCenter />` dentro del popover
- [x] 4.3 Mover estado de visibilidad del popover a `Layout.tsx` (estado local `isNotificationsOpen`)
- [x] 4.4 Conectar click del bell icon en `Layout.tsx` para toggle del popover
- [x] 4.5 Implementar click-outside: usar `useEffect` con `document.addEventListener('mousedown')` y ref al popover
- [x] 4.6 Implementar cierre con tecla ESC: `document.addEventListener('keydown')` para Escape
- [x] 4.7 Eliminar ruta `/notifications` de `router.tsx` y reemplazar con redirect a `/events` (opcional)
- [x] 4.8 Ajustar estilos del popover: `position: absolute`, `z-index` alto, ancho fijo ~360px, sombra

## 5. Fix Endpoint de Cursos

- [x] 5.1 Verificar si `CoursesService.getOwnCourses()` existe en `@uniconnect/shared`; si no, agregarlo apuntando a `/courses/get-own`
- [x] 5.2 Actualizar `Frontend-web/src/features/courses/services/index.ts` para exponer `getOwnCourses` si se agregó
- [x] 5.3 Actualizar `Frontend-web/src/features/students/hooks/useProfile.ts`: cambiar `coursesService.getByStudent()` por `coursesService.getOwnCourses()`
- [x] 5.4 Crear modal `AddCourseModal.tsx` en `Frontend-web/src/features/courses/components/` para listar cursos disponibles
- [x] 5.5 En `AddCourseModal`, consumir `coursesService.getByStudent()` (lista de disponibles) para el selector
- [x] 5.6 Implementar botón "Agregar curso" en `ProfileScreen.tsx` que abre el modal
- [x] 5.7 Implementar acción de agregar curso via `useStudentCourses.addCourse`
- [x] 5.8 Implementar editar estado de curso en `ProfileScreen.tsx` (botón edit + selector de estado)
- [x] 5.9 Implementar eliminar curso en `ProfileScreen.tsx` (botón delete + confirmación)
- [x] 5.10 Actualizar `CourseList.tsx` (página `/courses`) para usar `coursesService.getOwnCourses()` correctamente

## 6. Login Loader Fix

- [x] 6.1 En `useWebAuth.ts`, mover `setIsLoading(false)` del bloque `finally` a un condicional que solo se ejecute cuando NO haya navegación exitosa
- [x] 6.2 Alternativa: retornar temprano del `finally` cuando `fenResponse.success === true` para evitar resetear loading
- [x] 6.3 En `LoginScreen.tsx`, asegurar que `if (authStore.isAuthenticated && !isLoading)` renderice el spinner (ya cubierto por paso anterior)
- [x] 6.4 Verificar que el spinner se mantiene visible durante toda la transición de login exitoso

## 7. Verificación Final

- [x] 7.1 Ejecutar `cd Frontend-web && npx tsc --noEmit` y resolver errores TypeScript
- [x] 7.2 Verificar navegación manual: ir a `/groups/:id` desde perfil de estudiante, confirmar no crash
- [x] 7.3 Verificar popover: click en bell, click outside, ESC, re-click en bell
- [x] 7.4 Verificar cursos: confirmar que ProfileScreen muestra cursos inscritos, no disponibles
- [x] 7.5 Verificar login: iniciar sesión, confirmar que no aparece "Bienvenido" flash
- [x] 7.6 Verificar chat: navegar a grupo donde se es miembro, enviar mensaje, recargar página
