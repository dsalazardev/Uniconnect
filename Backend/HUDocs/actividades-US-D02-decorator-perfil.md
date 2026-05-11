# Actividades — US-D02: Patrón Decorator en el Perfil del Estudiante

---

## Tarea 1: Definir IPerfilEstudiante, tipos auxiliares y decoradores de dominio

**Prompt Sugerido:**
Crea `Backend/src/users/domain/decorator/interfaces/perfil-estudiante.interface.ts`.
Define `IPerfilEstudiante` con métodos `getNombre()`, `getCarrera()`, `getSemestre()`, `getAsignaturasActivas()` y `render(): PerfilRendered`. Define también los tipos de soporte: `Asignatura { id_course, nombre }`, `EstadisticasEstudiante { gruposCreados, gruposParticipa, mensajesEnviados }`, `Insignia { id, nombre, descripcion, icono }` y `PerfilRendered { id, nombre, carrera, semestre, asignaturasActivas, estadisticas?, insignias? }`. Re-exporta desde `interfaces/index.ts`.
Crea `perfil-base.ts` implementando `IPerfilEstudiante` con los cuatro campos base; `render()` retorna solo esos campos sin estadísticas ni insignias.
Crea `perfil-decorator.abstract.ts` que extiende `IPerfilEstudiante` y delega los métodos al componente envuelto, dejando `render()` abstracto.
Crea `perfil-con-estadisticas.decorator.ts` que extiende el abstract y añade `{ estadisticas }` al `render()` del envuelto.
Crea `insignias/insignias.factory.ts` con `calcularInsignias(estadisticas, semestre)` y 6 insignias: Fundador (1+ grupo creado), Explorador (3+ grupos participados), Comunicador (10+ mensajes), Maratonista (50+ mensajes), Veterano (semestre ≥5), Líder (3+ grupos creados).
Crea `perfil-con-insignias.decorator.ts` que extiende el abstract y añade `{ insignias }` al `render()`.
Actualiza `index.ts` del módulo para re-exportar todos los nuevos artefactos.

**Commit:** `feat(users/decorator): definir IPerfilEstudiante, PerfilBase y decoradores CA#1-CA#3`

**Estimación:** 1.5 h

---

## Tarea 2: Tests del patrón Decorator (19 casos por criterio de aceptación)

**Prompt Sugerido:**
Crea `Backend/src/users/domain/decorator/__tests__/perfil-decorator.spec.ts`.
Escribe suites agrupadas por CA:
- **CA #1 (PerfilBase)**: getNombre(), getCarrera(), getSemestre(), getAsignaturasActivas(); render() sin estadísticas ni insignias; carrera nula retorna null.
- **CA #2 (PerfilConEstadisticas)**: render() añade estadísticas y conserva datos base; delega getNombre(); no incluye insignias.
- **CA #3 (PerfilConInsignias)**: calcularInsignias desbloquea Fundador con 1+ grupo, Explorador con 3+ grupos, Comunicador con 10+ mensajes, Veterano con semestre ≥5; NO desbloquea Veterano con semestre <5; retorna array vacío si no cumple ningún hito.
- **Composición**: render() con dos decoradores apilados incluye base + estadísticas + insignias; la cadena de delegación conserva getNombre(), getCarrera(), getSemestre(), getAsignaturasActivas().

**Commit:** `feat(users/decorator): agregar 19 tests del patrón Decorator por criterio de aceptación`

**Estimación:** 1 h

---

## Tarea 3: PerfilService — construcción del perfil desde DB con decoradores

**Prompt Sugerido:**
Crea `Backend/src/users/perfil.service.ts` con `@Injectable()`.
Inyecta `PrismaService`.
Implementa `getPerfil(userId)` (CA #5): consulta `user` con `program` y `enrollments` activas; lanza `NotFoundException` si no existe; construye `PerfilBase` y retorna `render()`. Sin consultas adicionales de estadísticas.
Implementa `getPerfilCompleto(userId)` (CA #4): ejecuta `Promise.all` con cuatro queries paralelas: datos del usuario, `group.count({ owner_id })` para gruposCreados, `membership.count({ id_user })` para gruposParticipa, `message.count({ membership: { id_user } })` para mensajesEnviados. Construye la cadena: `PerfilBase → new PerfilConEstadisticas(perfil, estadisticas) → new PerfilConInsignias(perfil, calcularInsignias(...))`. Retorna `perfil.render()`.

**Commit:** `feat(users): agregar PerfilService y PerfilController con endpoints CA#4 y CA#5`

**Estimación:** 1.5 h

---

## Tarea 4: PerfilController y registro en UsersModule

**Prompt Sugerido:**
Crea `Backend/src/users/perfil.controller.ts` con `@Controller('perfil')`, `@UseGuards(JwtAuthGuard)`, `@ApiTags('Perfil')`.
Implementa `GET /:id` con `@Query('vista') vista?: string`: si `vista === 'completa'` llama a `perfilService.getPerfilCompleto(id)`, de lo contrario llama a `perfilService.getPerfil(id)`. Documenta con `@ApiOperation` y `@ApiQuery({ name: 'vista', enum: ['completa'] })`.
En `users.module.ts` importa `PerfilController` y `PerfilService`, agrega ambos a `controllers` y `providers`.

**Commit:** `feat(users): agregar PerfilService y PerfilController con endpoints CA#4 y CA#5`

**Estimación:** 0.5 h

---

## Tarea 5: Tipos y métodos de servicio en el paquete compartido

**Prompt Sugerido:**
En `Frontend/shared/src/types/students.ts` agrega: `AsignaturaActiva`, `EstadisticasEstudiante`, `InsigniaEstudiante`, `PerfilBase { id, nombre, carrera, semestre, asignaturasActivas }` y `PerfilCompleto extends PerfilBase { estadisticas, insignias }`.
En `Frontend/shared/src/types/index.ts` re-exporta los nuevos tipos.
En `Frontend/shared/src/api/endpoints/students.ts` agrega `GET_PERFIL_BASE: (id) => '/perfil/:id'` y `GET_PERFIL_COMPLETO: (id) => '/perfil/:id?vista=completa'`.
En `Frontend/shared/src/services/students.service.ts` agrega `getPerfilBase(userId): Promise<PerfilBase>` y `getPerfilCompleto(userId): Promise<PerfilCompleto>`, ambos usando los nuevos endpoints.

**Commit:** `feat(shared): agregar tipos y métodos de servicio para US-D02 Decorator`

**Estimación:** 0.5 h

---

## Tarea 6: Frontend-web — hook y vista completa en StudentProfile

**Prompt Sugerido:**
Crea `Frontend/Frontend-web/src/features/students/hooks/usePerfilEstudiante.ts` con:
- `usePerfilBase(userId)`: fetcha GET /perfil/:id en montaje.
- `usePerfilCompleto(userId, enabled)`: fetcha GET /perfil/:id?vista=completa solo cuando `enabled=true`.
En `StudentProfile.tsx`:
- Importa `useSearchParams` de react-router-dom; extrae `vista === 'completa'` del query param.
- Llama a `usePerfilCompleto(targetUserId, vistaCompleta)`.
- Agrega una `topBar` con el botón "Ver perfil completo" / "Ver perfil base" que navega a `?vista=completa` o sin query.
- Después de la sección de materias añade: sección **Estadísticas** (gruposCreados, gruposParticipa, mensajesEnviados) y sección **Insignias** (grid de cards con icono, nombre y descripción) condicionales a `vistaCompleta && perfilCompleto`.
- Agrega los estilos en `StudentProfile.module.css`: `.topBar`, `.vistaCompletaButton`, `.vistaBaseButton`, `.insigniasGrid`, `.insigniaCard`, `.insigniaIcono`, `.insigniaNombre`, `.insigniaDesc`, `.emptyText`.

**Commit:** `feat(web): mostrar estadísticas e insignias del patrón Decorator en StudentProfile`

**Estimación:** 1.5 h

---

## Tarea 7: Frontend-mobile — hook y vista completa en student-profile

**Prompt Sugerido:**
Crea `Frontend/Frontend-mobile/src/features/students/hooks/usePerfilEstudiante.ts` (mismo contrato que web: `usePerfilBase` y `usePerfilCompleto`).
En `app/(tabs)/student-profile.tsx`:
- Importa `useState` y `usePerfilCompleto`.
- Agrega estado `vistaCompleta: boolean` con `useState(false)`.
- Llama a `usePerfilCompleto(Number(id), vistaCompleta)`.
- Inserta antes de "Materias en Común" un `TouchableOpacity` (`vistaButton`) que hace toggle de `vistaCompleta`; el label cambia entre "Ver perfil completo" y "Ver perfil base".
- Cuando `vistaCompleta && perfilCompleto?.estadisticas`: muestra una sección "📊 Estadísticas" con tres `statRow` (gruposCreados, gruposParticipa, mensajesEnviados).
- Cuando `vistaCompleta && perfilCompleto?.insignias`: muestra una sección "🏅 Insignias" con `insigniasGrid` de `insigniaCard` (icono, nombre, descripción).
- Agrega estilos al `StyleSheet`: `vistaButton`, `vistaButtonActive`, `vistaButtonText`, `vistaButtonTextActive`, `statRow`, `statLabel`, `statValue`, `insigniasGrid`, `insigniaCard`, `insigniaIcono`, `insigniaNombre`, `insigniaDesc`.

**Commit:** `feat(mobile): mostrar estadísticas e insignias del patrón Decorator en student-profile`

**Estimación:** 1.5 h

---

**Estimación total:** 8 h
