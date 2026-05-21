## Context

### Current State

El Sprint 4 implementó 4 módulos backend con 22 endpoints:

| Módulo | Endpoints | Tests existentes | Zod schemas en shared |
|--------|-----------|-----------------|----------------------|
| Foro | 7 (CRUD preguntas, respuestas, votos, aceptar) | Solo CoR unit tests (12) | ❌ Ninguno |
| Biblioteca | 8 (programas, CRUD recursos, comentarios, valoraciones) | 0 | ❌ Ninguno |
| Sesiones | 4 (CRUD sesiones, asistencia) | 0 | ❌ Ninguno |
| Encuestas | 3 (crear, votar, obtener) | 0 | ❌ Ninguno |

**Shared package gaps detectados:**
- No existen Zod schemas para ninguna entidad Sprint 4
- No existe `study-sessions.service.ts` (solo types)
- No existen endpoint constants para study-sessions
- Sprint 4 services (`ResourcesService`, `ForumService`, `PollService`) retornan `response.data` crudo sin FENResponse
- `ErrorDetails.details` usa `any` (viola Zero-Any policy)

### Infraestructura de testing existente

- `Backend/test/jest-e2e.json`: Config para e2e (regex `.e2e-spec.ts$`)
- `Backend/test/events.e2e-spec.ts`: Patrón de ejemplo con Supertest + Prisma mocking
- `Backend/QA-tests/helpers/jwt-test.helper.ts`: `signTestJwt()` para JWT en tests
- `Backend/src/test/mocks/prisma.mock.ts`: `createPrismaMock()` canónico
- `.github/workflows/ci.yml`: Pipeline actual con lint → typecheck → test (sin e2e, sin cobertura mínima)

## Goals / Non-Goals

**Goals:**
- Cada endpoint Sprint 4 tiene ≥1 test de integración que valida su contrato de respuesta
- Zod schemas publicados en `@uniconnect/shared` y consumidos por los tests
- Compilación TS falla si un contrato Zod cambia sin actualizar consumidores
- Cobertura ≥70% en archivos fuente de módulos Sprint 4
- Maestro instalado y configurado en Frontend-mobile
- Prueba E2E que crea sesión desde mobile y verifica sincronización WebSocket con calendario web
- Pipeline CI extiende con jobs de integración y E2E, recolecta artefactos en fallos
- README móvil documenta ejecución local de E2E e interpretación de artefactos

**Non-Goals:**
- Tests unitarios para servicios Sprint 4 (cubiertos por tests de integración)
- Pruebas E2E para foro, biblioteca o encuestas (solo sesiones de estudio)
- Migración de servicios Sprint 4 a FENResponse (mejora separada)
- Cobertura >70% (el umbral mínimo es 70%)

## Decisions

### D1. Arquitectura de Zod Schemas

```
shared/src/validators/
├── fen.validator.ts              # Existente
├── events.validator.ts           # Existente
├── groups.validator.ts           # Existente
├── resources.validator.ts        # NUEVO
├── forum.validator.ts            # NUEVO
├── study-sessions.validator.ts   # NUEVO
├── polls.validator.ts            # NUEVO
└── index.ts                      # Actualizado
```

Cada validador define:
- **Schema de entidad**: Ej. `ResourceSchema = z.object({...})`
- **Schema de array**: `ResourceArraySchema = z.array(ResourceSchema)`
- **Schema FEN**: `ResourceFENResponseSchema = createFENResponseSchema(ResourceSchema)`
- **DTO schemas**: `CreateResourcePayloadSchema`, etc.
- **Tipo derivado**: `export type Resource = z.infer<typeof ResourceSchema>`

**Decisión**: Los schemas Zod son la fuente de verdad. Los tipos en `types/resources.ts` se derivarán de `z.infer<>` para garantizar CA4.

### D2. Estrategia de Tests de Integración

```
Backend/test/
├── jest-e2e.json                   # Existente
├── app.e2e-spec.ts                 # Existente
├── events.e2e-spec.ts              # Existente
├── helpers/
│   ├── jwt-test.helper.ts          # NUEVO (copiar desde QA-tests/)
│   ├── prisma-mock.factory.ts      # NUEVO (extender createPrismaMock con Sprint 4 models)
│   └── test-app.builder.ts         # NUEVO (buildTestApp reutilizable)
├── forum.e2e-spec.ts              # NUEVO ~14 tests
├── resources.e2e-spec.ts          # NUEVO ~16 tests
├── study-sessions.e2e-spec.ts     # NUEVO ~8 tests
└── polls.e2e-spec.ts              # NUEVO ~6 tests
```

**Patrón por test:**
```typescript
import { request, TestApp } from './helpers/test-app.builder';
import { ForumQuestionArraySchema } from '@uniconnect/shared';

describe('Forum (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => { app = await buildTestApp(); });
  afterAll(async () => { await app.close(); });

  it('GET /courses/:id/forum/questions returns questions matching contract', async () => {
    const questions = [{ id_question: 1, id_course: 1, id_user: 1, title: 'Test', body: 'Body', status: 'OPEN', vote_count: 0, answer_count: 0, created_at: new Date(), author: { id_user: 1, full_name: 'Test User', picture: null } }];
    app.prisma.forum_question.findMany.mockResolvedValue(questions);
    app.prisma.forum_vote.findMany.mockResolvedValue([]);

    const res = await request(app.httpServer)
      .get('/courses/1/forum/questions')
      .set('Authorization', `Bearer ${signTestJwt(1)}`)
      .expect(200);

    const parsed = ForumQuestionArraySchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
  });
});
```

**Decisión**: Usar Jest + Supertest (no supertest literalmente, sino `request` de Supertest) con el patrón existente. Los tests validan el body contra Zod schemas importados desde `@uniconnect/shared`. No usar `FENResponse` para Sprint 4 porque los servicios actuales no lo envuelven.

### D3. Prisma Mocking para Sprint 4

Extender el `createPrismaMock()` existente en `Backend/src/test/mocks/prisma.mock.ts` con los nuevos modelos:

| Modelo | Métodos necesarios |
|--------|-------------------|
| `forum_question` | findMany, findUnique, create, update, count |
| `forum_answer` | findMany, findUnique, create, update, count |
| `forum_vote` | findMany, findUnique, create, delete, count |
| `resource` | findMany, findUnique, create, update, delete |
| `resource_tag` | findMany, createMany, deleteMany |
| `resource_rating` | findMany, upsert |
| `resource_comment` | findMany, create |
| `study_session` | findMany, findUnique, create |
| `study_session_instance` | findMany, findUnique, create, update |
| `session_attendance` | findMany, upsert |
| `poll` | findMany, findUnique, create, update |
| `poll_option` | findMany, create |
| `poll_vote` | findMany, findUnique, create, count |

**Decisión**: En lugar de modificar el mock canónico (para no romper tests existentes), crear `Backend/test/helpers/prisma-mock.factory.ts` que extienda `createPrismaMock()` con los modelos Sprint 4.

### D4. Configuración Maestro

```
Frontend/Frontend-mobile/
├── .maestro/
│   └── config.yaml                  # Config global Maestro
├── maestro/
│   ├── flows/
│   │   └── study-session.yaml       # Flow E2E: crear sesión
│   └── shared/
│       └── login.yaml               # Subflow: login reusable
├── .env.maestro                     # Env para tests E2E
└── package.json                     # + devDependency: maestro

Frontend/Frontend-web/
├── maestro/
│   └── flows/
│       └── verify-session-web.yaml  # Flow: verificar sesión en calendario web
```

**Decisión**: Usar Maestro en lugar de Detox porque:
1. No requiere toolchain nativa (Xcode/Android SDK build) — funciona con APK instalada
2. Configuración YAML declarativa, más rápida de escribir
3. Soporta flows multi-app (mobile + web en同一 flow)
4. Captura screenshots/video nativamente en fallos

### D5. CI Pipeline Extendido

```yaml
jobs:
  # Job existente (lint + typecheck + test para cada paquete)
  backend:
    steps:
      - ...lint, typecheck, test
      - name: Integration tests
        run: cd Backend && npm run test:e2e -- --coverage
      - name: Check coverage
        run: cd Backend && npx jest --coverage --testPathPattern='e2e' --coverageThreshold='{"global":{"branches":70,"functions":70,"lines":70,"statements":70}}'

  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          target: google_apis
          arch: x86_64
          script: |
            # Install Maestro
            curl -Ls "https://get.maestro.mobile.dev" | bash
            # Install app
            adb install Frontend/Frontend-mobile/android/app/build/outputs/apk/debug/app-debug.apk
            # Run E2E flow
            maestro test Frontend/Frontend-mobile/maestro/flows/study-session.yaml
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: maestro-artifacts
          path: ~/.maestro/output/
```

### D6. StudySessionsService en Shared

Crear `Frontend/shared/src/services/study-sessions.service.ts` siguiendo el patrón DI de los otros servicios:

```typescript
export class StudySessionsService {
  constructor(private readonly api: AxiosInstance) {}

  async createSession(groupId: number, payload: CreateStudySessionDto): Promise<StudySessionInstance[]> {
    const { data } = await this.api.post(`/groups/${groupId}/study-sessions`, payload);
    return data;
  }

  async getSessions(groupId: number): Promise<StudySessionInstance[]> { ... }
  async cancelInstance(instanceId: number): Promise<void> { ... }
  async updateAttendance(instanceId: number, status: AttendanceStatus): Promise<void> { ... }
}
```

Endpoint constants en `Frontend/shared/src/api/endpoints/study-sessions.ts`.

## Riesgos / Trade-offs

| Riesgo | Mitigación |
|--------|-----------|
| **Maestro no soporta multi-app (mobile+web) en un solo flow de forma nativa** | Usar dos flows separados o usar `runFlow` con cambio de contexto. Alternativa: validar sincronización vía API backend en lugar de Web UI |
| **Emulador Android en CI es lento (~15-20 min)** | Cachear AVD snapshot con `avdmanager`. Ejecutar solo en PRs a main, no en cada push |
| **Tests de integración lentos por init de NestJS** | Usar `beforeAll` con `Test.createTestingModule` (no arrancar AppModule completo). Inicializar una sola vez por archivo |
| **Sprint 4 services no usan FENResponse** | Los tests validan contra Zod directamente, no requieren FEN. La migración a FENResponse queda como mejora separada |
| **Zod schemas pueden desincronizarse del backend real** | Los tests de integración validan contra el backend real (con Prisma mockeado). Si el backend cambia, el test falla. Si el schema cambia pero el backend no, el tipo derivado cambia y TS falla |
| **CA4 (compilación falla si contrato cambia)** solo funciona si los tipos frontend se derivan de Zod | Migrar types Sprint 4 a `z.infer<>`. Esto se hace dentro de esta HU |

## Migration Plan

1. **Fase 1 — Zod schemas en shared**: Crear validators + migrar types a `z.infer<>`
2. **Fase 2 — Service faltante**: Crear `study-sessions.service.ts` + endpoint constants
3. **Fase 3 — Helpers de test**: Extender Prisma mock + copiar `signTestJwt()` a `Backend/test/helpers/`
4. **Fase 4 — Tests de integración**: Escribir `.e2e-spec.ts` para cada módulo
5. **Fase 5 — Maestro config + flow E2E**: Instalar Maestro, escribir flow login + study-session
6. **Fase 6 — Pipeline CI**: Extender `ci.yml` con jobs de integración y E2E
7. **Fase 7 — Documentación**: Actualizar README móvil

**Rollback**: Cada fase es independiente. Si CI falla, se puede revertir el job sin afectar el resto.

## Open Questions

- ¿Maestro puede interactuar con una web (calendario) dentro del mismo flow? Si no, validar sincronización vía API polling desde el test.
- ¿Usar AVD snapshot cache en CI para acelerar? Investigar `reactivecircus/android-emulator-runner` con `emulator-boot-timeout`.
- ¿El calendario web existe ya o necesita implementación previa? Asumimos que existe un endpoint `GET /study-sessions` al que el web llama.
