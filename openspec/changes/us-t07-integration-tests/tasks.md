## 1. Implementar pruebas de integración para endpoints del Sprint 4 y validar contra contratos Zod compartidos

- [ ] 1.1 Crear Zod schemas para Resources en `shared/src/validators/resources.validator.ts` (ResourceSchema, ResourceArraySchema, CreateResourcePayloadSchema, UpdateResourcePayloadSchema, ResourceFENResponseSchema)
- [ ] 1.2 Crear Zod schemas para Forum en `shared/src/validators/forum.validator.ts` (ForumQuestionSchema, ForumQuestionArraySchema, ForumAnswerSchema, ForumAnswerArraySchema, CreateQuestionDtoSchema, CreateAnswerDtoSchema)
- [ ] 1.3 Crear Zod schemas para Study Sessions en `shared/src/validators/study-sessions.validator.ts` (StudySessionInstanceSchema, StudySessionInstanceArraySchema, CreateStudySessionDtoSchema, UpdateAttendanceDtoSchema)
- [ ] 1.4 Crear Zod schemas para Polls en `shared/src/validators/polls.validator.ts` (PollSchema, PollArraySchema, PollOptionSchema, CreatePollDtoSchema, CastVoteDtoSchema, PollFENResponseSchema)
- [ ] 1.5 Actualizar `shared/src/validators/index.ts` para exportar los nuevos validators
- [ ] 1.6 Actualizar `shared/src/types/resources.ts`, `forum.ts`, `polls.ts`, `study-session.ts` para derivar tipos de Zod schemas usando `z.infer<>`
- [ ] 1.7 Actualizar `shared/src/types/index.ts` si es necesario
- [ ] 1.8 Migrar `Backend/QA-tests/helpers/jwt-test.helper.ts` a `Backend/test/helpers/jwt-test.helper.ts`
- [ ] 1.9 Crear `Backend/test/helpers/prisma-mock.factory.ts` extendiendo `createPrismaMock()` con modelos Sprint 4 (forum_question, forum_answer, forum_vote, resource, resource_tag, resource_rating, resource_comment, study_session, study_session_instance, session_attendance, poll, poll_option, poll_vote)
- [ ] 1.10 Crear `Backend/test/helpers/test-app.builder.ts` con `buildTestApp()` reutilizable que inicialice NestJS con AppModule + ValidationPipe
- [ ] 1.11 Escribir `Backend/test/forum.e2e-spec.ts` con tests para 7 endpoints: GET/POST questions, GET/POST answers, vote question, vote answer, accept answer
- [ ] 1.12 Escribir `Backend/test/resources.e2e-spec.ts` con tests para 8 endpoints: GET programas, GET/POST recursos, GET/PATCH/DELETE recurso, POST comentario, POST valoracion
- [ ] 1.13 Escribir `Backend/test/study-sessions.e2e-spec.ts` con tests para 4 endpoints: POST/GET sessions, DELETE instance, PATCH attendance
- [ ] 1.14 Escribir `Backend/test/polls.e2e-spec.ts` con tests para 3 endpoints: POST create, POST vote, GET poll
- [ ] 1.15 Ejecutar `npm run test:e2e` y verificar que los 44+ tests pasan
- [ ] 1.16 Verificar cobertura de los módulos Sprint 4 con `npx jest --coverage --testPathPattern='e2e'`
- [ ] 1.17 Verificar que `npx tsc --noEmit` en shared no reporta errores

## 2. Configurar el entorno de pruebas E2E (Maestro) en el proyecto móvil y validar errores de compilación en TypeScript

- [ ] 2.1 Agregar comando de instalación de Maestro en `Frontend/Frontend-mobile/package.json` como script `"install:maestro": "curl -Ls https://get.maestro.mobile.dev | bash"`
- [ ] 2.2 Crear `.maestro/config.yaml` con appId y configuración global de Maestro
- [ ] 2.3 Crear `Frontend/Frontend-mobile/maestro/shared/login.yaml` con subflow de autenticación (email/password o mock OAuth)
- [ ] 2.4 Verificar que `maestro --version` funciona desde el directorio Frontend-mobile
- [ ] 2.5 Crear `Frontend/shared/src/api/endpoints/study-sessions.ts` con constantes `STUDY_SESSION_ENDPOINTS` (CREATE, GET, DELETE, ATTENDANCE)
- [ ] 2.6 Actualizar `Frontend/shared/src/api/endpoints/index.ts` para exportar study-sessions endpoints
- [ ] 2.7 Crear `Frontend/shared/src/services/study-sessions.service.ts` con `StudySessionsService` usando DI pattern (AxiosInstance en constructor)
- [ ] 2.8 Actualizar `Frontend/shared/src/services/index.ts` para exportar `StudySessionsService`
- [ ] 2.9 Ejecutar `npx tsc --noEmit` en shared para verificar que los tipos derivados de Zod compilan sin errores
- [ ] 2.10 Ejecutar `npx tsc --noEmit` en Frontend-mobile para verificar que los cambios shared no rompen compilación

## 3. Escribir la prueba E2E para la creación de sesiones y verificar la sincronización por WebSockets con el calendario web

- [x] 3.1 Crear `Frontend/Frontend-mobile/maestro/flows/study-session.yaml` con flow completo: login → navegar a grupo → crear sesión con título, fecha, duración → verificar sesión en lista del grupo
- [x] 3.2 Agregar paso en el flow que capture screenshot después de crear la sesión
- [x] 3.3 Crear `Frontend/Frontend-web/maestro/flows/verify-session-web.yaml` con flow que navegue al calendario web y verifique que la sesión aparece (si Maestro soporta multi-app, o alternativa vía API)
- [x] 3.4 Implementar verificación de sincronización WebSocket: ejecutar flow mobile, luego consultar `GET /groups/:groupId/study-sessions` vía API para confirmar que la sesión está disponible sin recarga manual
- [ ] 3.5 ⏸️ Ejecutar flow completo localmente con backend + emulador Android y verificar que pasa (pendiente de verificación manual — requiere emulador + backend + APK debug instalada)
- [ ] 3.6 ⏸️ Verificar que en caso de fallo, Maestro genera screenshots en `~/.maestro/output/` (depende de 3.5)

## 4. Configurar el pipeline de CI para la ejecución de pruebas, umbral de cobertura del 70% y recolección de artefactos

- [ ] 4.1 Extender `.github/workflows/ci.yml` con paso de `npm run test:e2e -- --coverage` en el job `backend`
- [ ] 4.2 Agregar verificación de umbral de cobertura ≥70% para statements, branches, functions, lines en módulos Sprint 4
- [ ] 4.3 Agregar job `e2e-android` en `ci.yml` con `reactivecircus/android-emulator-runner@v2` (API 34)
- [ ] 4.4 Configurar instalación de Maestro en el job E2E vía `curl -Ls "https://get.maestro.mobile.dev" | bash`
- [ ] 4.5 Configurar instalación del APK debug en el emulador (`adb install`)
- [ ] 4.6 Configurar ejecución del flow `maestro test maestro/flows/study-session.yaml`
- [ ] 4.7 Configurar subida de artefactos en fallo: `actions/upload-artifact@v4` con path `~/.maestro/output/`
- [ ] 4.8 Condicionar job E2E para ejecutar solo en PRs a main o workflow_dispatch (no en cada push)
- [ ] 4.9 Configurar `romeovs/lcov-reporter-action` para comentario de cobertura en PRs

## 5. Documentar en el README móvil el proceso de ejecución local de E2E y la interpretación de artefactos del CI

- [ ] 5.1 Agregar sección "Pruebas E2E (Maestro)" en `Frontend/Frontend-mobile/README.md`
- [ ] 5.2 Documentar instalación de Maestro (`brew install maestro` para macOS, `curl` para Linux/WSL)
- [ ] 5.3 Documentar precondiciones: emulador Android corriendo, backend en ejecución, APK debug instalada
- [ ] 5.4 Documentar comandos de ejecución: `maestro test maestro/flows/study-session.yaml` para flow específico, `maestro test maestro/flows/` para todos
- [ ] 5.5 Documentar cómo descargar artefactos de CI desde GitHub Actions (Actions → run fallido → Artifacts → maestro-artifacts.zip)
- [ ] 5.6 Documentar cómo interpretar artefactos: screenshots por paso, video `.mp4` del flow completo
- [ ] 5.7 Documentar cómo re-ejecutar flow localmente con artefactos descargados para debuggear fallos
