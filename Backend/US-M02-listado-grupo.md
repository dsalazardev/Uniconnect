## FRONTEND

### 1. Título: Indicador visual de límite de grupos por asignatura en CreateGroupModal

**Prompt Sugerido:**
En el archivo `Frontend/Frontend-mobile/src/features/groups/components/CreateGroup.tsx` (o `CreateGroupModal.tsx`), el modal de creación ya recibe la prop `groupsPerCourse` con el conteo de grupos por asignatura, pero no la utiliza para dar retroalimentación visual al usuario.

Implementa lo siguiente dentro del modal de creación:

1. Cuando el usuario selecciona una asignatura en el selector del formulario, calcular cuántos grupos ya tiene en esa asignatura usando el `groupsPerCourse` recibido como prop.
2. Mostrar un badge o texto informativo debajo del selector de asignatura con el formato: `"X de 3 grupos en esta materia"`. Usar color neutro si X < 3, color naranja/rojo si X = 3.
3. Si el conteo es igual a 3, deshabilitar el botón de "Crear grupo" y mostrar el mensaje: `"Has alcanzado el límite de 3 grupos para esta materia."` debajo del badge, alineado con el mismo estilo de error que usa el resto del formulario.
4. La deshabilitación debe ser reactiva: si el usuario cambia de asignatura a una donde tiene menos de 3 grupos, el botón debe volver a habilitarse automáticamente.
5. No modificar ninguna lógica de backend ni el sistema de chat. Solo cambios en el componente de UI del modal de creación.

**Commit:**
`feat(groups-mobile): mostrar indicador de límite de grupos por asignatura en modal de creación`

**Estimación:**
1 horas
