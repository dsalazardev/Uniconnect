# Tasks: US-INF09 Pipeline CI/CD Unificado

> **Estimación total**: 5.5h  
> **Dependencias**: Ninguna externa. Se requiere acceso a secrets de Fly.io, EAS y Slack.

---

## Tarea 1 — Saneamiento de archivos huérfanos y duplicados

**Descripción**: Eliminar archivos que sobran y causan confusión.

- Eliminar `D:\Uniconnect\eas.json` (0 bytes, huérfano)
- Eliminar `D:\Uniconnect\Frontend\Frontend-mobile\.github\workflows\ci-cd.yml` (duplicado de `Frontend/.github/`)

**Commit**: `chore(infra): remove orphan eas.json and duplicate mobile workflow`

**Estimación**: 0.25h

---

## Tarea 2 — Estandarizar scripts en Frontend-mobile

**Descripción**: Agregar scripts de `lint` y `type-check` faltantes en `Frontend/Frontend-mobile/package.json`.

Agregar al `"scripts"`:
```json
"lint": "eslint \"src/**/*.{ts,tsx}\" --fix",
"type-check": "tsc --noEmit"
```

Instalar dev dependencies necesarias si no existen: `eslint`, `typescript`.

**Commit**: `chore(mobile): add lint and type-check scripts`

**Estimación**: 0.5h

---

## Tarea 3 — Estandarizar scripts en Shared

**Descripción**: Agregar script de `lint` faltante en `Frontend/shared/package.json`.

Agregar:
```json
"lint": "eslint \"src/**/*.ts\" --fix"
```

Instalar `eslint` como devDependency si no existe.

**Commit**: `chore(shared): add lint script`

**Estimación**: 0.25h

---

## Tarea 4 — Agregar type-check script en Backend

**Descripción**: Agregar script `type-check` en `Backend/package.json` (actualmente no existe como script dedicado).

Agregar:
```json
"type-check": "tsc --noEmit"
```

**Commit**: `chore(backend): add type-check script`

**Estimación**: 0.25h

---

## Tarea 5 — Crear workflow CI unificado

**Descripción**: Reemplazar `Frontend/.github/workflows/ci-cd.yml` por un `ci.yml` con matrix jobs que:

- Detecte cambios por ruta con `dorny/paths-filter`
- Ejecute lint, type-check, test con cobertura solo en paquetes afectados
- Suba artifacts de cobertura
- Reporte status checks en PRs

Ver diseño.md sección 2.1 para el YAML completo.

**Commit**: `feat(ci): add unified matrix CI workflow with path filtering`

**Estimación**: 1.5h

---

## Tarea 6 — Crear workflow CD

**Descripción**: Crear `Frontend/.github/workflows/cd.yml` con 3 jobs de deploy:

1. **Backend**: `flyctl deploy` + health check con curl retry
2. **Web**: `npm ci` → `npm run build` → `flyctl deploy`
3. **Mobile**: `npm ci` → `npx eas build --platform all --profile preview`

Cada job se ejecuta solo si hubo cambios en su ruta.

**Commit**: `feat(cd): add deploy workflow for backend, web, and mobile`

**Estimación**: 1.5h

---

## Tarea 7 — Agregar notificaciones de error

**Descripción**: Agregar paso `if: failure()` a los workflows CI y CD que notifique por Slack webhook.

- Usar `slackapi/slack-github-action@v2`
- Mensaje con: workflow name, branch, job/step que falló, link al run, autor del commit

**Commit**: `feat(ci): add Slack notifications on pipeline failure`

**Estimación**: 0.5h

---

## Tarea 8 — Configurar reporte de cobertura en PRs

**Descripción**: Agregar paso que publique el reporte de cobertura como comment en el PR.

Opción: usar `davelosert/vitest-coverage-report-action@v2` (para web con vitest) o `romeovs/lcov-reporter-action@v0.4` (para backend con Jest + lcov).

- Backend: Jest genera `lcov.info` → `romeovs/lcov-reporter-action`
- Web: Vitest genera `lcov.info` → `davelosert/vitest-coverage-report-action`
- Mobile/Shared: similar según cada framework

**Commit**: `feat(ci): add coverage report to PR comments`

**Estimación**: 0.5h

---

## Tarea 9 — Documentación

**Descripción**: Crear `CI-CD.md` en la raíz del monorepo con:

1. Diagrama de flujo CI/CD
2. Tabla de secretos requeridos y dónde obtenerlos
3. Procedimiento de rollback para cada artefacto
4. Comandos de verificación local

**Commit**: `docs: add CI/CD documentation with diagrams and rollback guide`

**Estimación**: 0.5h

---

## Resumen

| # | Tarea | Tipo | Estimación |
|---|---|---|---|
| 1 | Saneamiento de archivos | chore | 0.25h |
| 2 | Scripts faltantes en mobile | chore | 0.5h |
| 3 | Script lint en shared | chore | 0.25h |
| 4 | Script type-check en backend | chore | 0.25h |
| 5 | Workflow CI unificado | feat | 1.5h |
| 6 | Workflow CD | feat | 1.5h |
| 7 | Notificaciones de error | feat | 0.5h |
| 8 | Reporte de cobertura en PRs | feat | 0.5h |
| 9 | Documentación | docs | 0.5h |
| | **Total** | | **5.75h** |
