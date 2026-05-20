## ADDED Requirements

### Requirement: Las mutaciones de cursos invalidan la caché compartida
El sistema de cursos en web SHALL invalidar todas las queryKeys relacionadas con cursos tras una mutación exitosa (agregar, eliminar, actualizar estado).

#### Scenario: Agregar curso invalida caché
- **WHEN** el usuario agrega un curso exitosamente
- **THEN** `useStudentCourses` invalida `['courses']` y `['my-courses']`
- **AND** `ProfileScreen` y `CourseList` se re-renderizan con datos actualizados sin recarga manual

#### Scenario: Eliminar curso invalida caché
- **WHEN** el usuario elimina un curso exitosamente
- **THEN** `useStudentCourses` invalida `['courses']` y `['my-courses']`
- **AND** el curso eliminado desaparece de la lista inmediatamente

#### Scenario: Actualizar estado de curso invalida caché
- **WHEN** el usuario cambia el estado de un curso (ej. "Cursando" → "Finalizado")
- **THEN** `useStudentCourses` invalida `['courses']` y `['my-courses']`
- **AND** el nuevo estado se refleja en `ProfileScreen` y `CourseList`
