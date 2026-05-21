## Why

El Sprint 4 entregó 22 endpoints nuevos (foro, biblioteca, sesiones de estudio, encuestas) sin pruebas automatizadas. Esto genera riesgo de regresión silenciosa en cada deploy. Además, no existe validación de contratos compartida entre backend y frontends — cualquier cambio en una respuesta puede romper mobile o web sin que el compilador lo detecte. Necesitamos una suite de integración que valide contratos y un pipeline E2E que cubra el flujo crítico de sesiones de estudio.

## What Changes

- **Zod schemas para Sprint 4**: Crear validadores en `@uniconnect/shared` para Resource, ForumQuestion, ForumAnswer, Poll, StudySessionInstance y sus DTOs, usados como única fuente de verdad para contratos.
- **Tests de integración backend**: Suite de 49+ tests sobre los 22 endpoints Sprint 4 usando Jest + Supertest, validando cada respuesta contra los Zod schemas compartidos.
- **Servicio faltante de study-sessions**: Crear `StudySessionsService` y endpoint constants en shared para que mobile/web puedan consumir el módulo.
- **Entorno E2E con Maestro**: Configurar Maestro en Frontend-mobile para pruebas E2E del flujo de creación de sesiones de estudio.
- **Prueba E2E sesión → calendario**: Test que crea una sesión desde la app móvil y verifica que aparece en el calendario web mediante WebSockets.
- **Pipeline CI**: Extender `ci.yml` con job de tests de integración backend, job E2E mobile con emulador Android, umbral de cobertura del 70% y artefactos (capturas/video).
- **Documentación README**: Sección de pruebas E2E en el README móvil con instrucciones de ejecución local e interpretación de artefactos CI.

## Capabilities

### New Capabilities

- `integration-contracts`: Zod schemas y tests de integración para los 22 endpoints del Sprint 4, validando contratos de respuesta contra `@uniconnect/shared`.
- `e2e-mobile`: Configuración de Maestro en Frontend-mobile y prueba E2E del flujo de creación de sesiones de estudio con verificación de sincronización WebSocket al calendario web.
- `ci-pipeline`: Pipeline de CI con jobs de integración backend, E2E mobile, umbral de cobertura 70% y recolección de artefactos (screenshots/video en fallos).
- `e2e-docs`: Documentación en el README móvil para ejecución local de E2E e interpretación de artefactos del pipeline CI.

### Modified Capabilities

<!-- No existing specs are modified; this is entirely new testing infrastructure -->

## Impact

- **Backend** (`Backend/src/`): Sin cambios en código de producción. Nuevos archivos en `Backend/test/` y `Backend/QA-tests/helpers/`.
- **Shared package** (`Frontend/shared/src/`): Nuevos validators Zod, nuevo `study-sessions.service.ts`, nuevos endpoint constants. Tipos existentes (`types/study-session.ts`) seguirán funcionando.
- **Frontend-mobile** (`Frontend/Frontend-mobile/`): Nueva dependencia `maestro` (dev). Nuevo directorio `maestro/` con flows E2E. README actualizado.
- **CI** (`.github/workflows/ci.yml`): Nuevos jobs para integración backend y E2E mobile.
- **Dependencias nuevas**: `zod` ya está en shared (`^4.4.3`). Maestro requiere instalación global o vía npm.
