# Design: Pipeline CI/CD Unificado

---

## 1. Arquitectura General

```
     ┌──────────────────────────────────────────────────────────┐
     │                    GITHUB EVENTS                          │
     │  push (any branch)     pull_request (→main)    push main │
     └──────────┬──────────────────────┬────────────────┬───────┘
                │                      │                │
                ▼                      ▼                ▼
     ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
     │  ci.yml          │   │  ci.yml          │   │  cd.yml          │
     │  (lint+type+test)│   │  (lint+type+test)│   │  (deploy)        │
     │  filter by path  │   │  + status checks │   │  only main       │
     └──────────────────┘   └──────────────────┘   └──────────────────┘
                │                      │                      │
                ▼                      ▼                      ▼
     ┌──────────────────────────────────────────────────────────┐
     │                    MATRIX JOBS                            │
     │                                                          │
     │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
     │  │ backend  │  │   web    │  │  mobile  │  │  shared  │ │
     │  │ pnpm     │  │   npm    │  │   npm    │  │   npm    │ │
     │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
     │       │              │             │              │       │
     │       ├─ lint        ├─ lint       ├─ lint        ├─ lint │
     │       ├─ type-check  ├─ type-check ├─ type-check  ├─ type│
     │       ├─ test        ├─ test       ├─ test        ├─ test │
     │       └─ coverage    └─ coverage   └─ coverage    └─ cover│
     └──────────────────────────────────────────────────────────┘
                                │
                                ▼
     ┌──────────────────────────────────────────────────────────┐
     │              CD (only push to main)                      │
     │                                                          │
     │  ┌──────────────────┐  ┌──────────────────┐             │
     │  │ Backend: Fly.io  │  │ Web: Fly.io+Nginx │             │
     │  │ health check: ✅ │  │ build: vite build │             │
     │  │ release: prisma  │  │ artifact: dist/   │             │
     │  └──────────────────┘  └──────────────────┘             │
     │  ┌──────────────────────────────────────────────────────┐│
     │  │ Mobile: EAS Build (preview)                          ││
     │  │ trigger: via EAS CLI                                 ││
     │  │ report: URL de descarga en commit status             ││
     │  └──────────────────────────────────────────────────────┘│
     └──────────────────────────────────────────────────────────┘
```

---

## 2. Workflows

### 2.1 `ci.yml` — Pull Request Validation

```yaml
name: CI
on:
  push:
    branches-ignore: [main]
  pull_request:
    branches: [main]

jobs:
  # Determine qué paquetes cambiaron
  changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      web: ${{ steps.filter.outputs.web }}
      mobile: ${{ steps.filter.outputs.mobile }}
      shared: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            backend:
              - 'Backend/**'
            web:
              - 'Frontend/Frontend-web/**'
            mobile:
              - 'Frontend/Frontend-mobile/**'
            shared:
              - 'Frontend/shared/**'

  quality:
    needs: changes
    strategy:
      matrix:
        package:
          - name: backend
            workdir: Backend
            runner: pnpm
          - name: web
            workdir: Frontend/Frontend-web
            runner: npm
          - name: mobile
            workdir: Frontend/Frontend-mobile
            runner: npm
          - name: shared
            workdir: Frontend/shared
            runner: npm
    if: ${{ fromJSON(needs.changes.outputs)[matrix.package.name] }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - name: Install (pnpm)
        if: matrix.runner == 'pnpm'
        run: pnpm install --frozen-lockfile
      - name: Install (npm)
        if: matrix.runner == 'npm'
        run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --coverage
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.package.name }}
          path: ${{ matrix.package.workdir }}/coverage/
```

### 2.2 `cd.yml` — Deploy a Producción

```yaml
name: CD
on:
  push:
    branches: [main]

jobs:
  # ── BACKEND ──
  deploy-backend:
    if: ${{ contains(github.event.head_commit.modified, 'Backend/') }}
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: Backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      - name: Health check
        run: |
          curl --retry 6 --retry-delay 10 \
            https://uniconnect-backend-core-black-wave-3099.fly.dev/api/health

  # ── WEB ──
  deploy-web:
    if: ${{ contains(github.event.head_commit.modified, 'Frontend/Frontend-web/') }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: Frontend/Frontend-web
      - run: npm run build
        working-directory: Frontend/Frontend-web
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: Frontend/Frontend-web
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  # ── MOBILE ──
  deploy-mobile:
    if: ${{ contains(github.event.head_commit.modified, 'Frontend/Frontend-mobile/') }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: Frontend/Frontend-mobile
      - name: EAS Build (preview)
        run: npx eas build --platform all --profile preview --non-interactive
        working-directory: Frontend/Frontend-mobile
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 3. Saneamiento

| Archivo | Acción |
|---|---|
| `/eas.json` (raíz) | Eliminar (0 bytes, huérfano) |
| `Frontend/Frontend-mobile/.github/workflows/ci-cd.yml` | Eliminar (duplicado de Frontend/.github) |
| `Frontend/.github/workflows/ci-cd.yml` | Mantener como base, reemplazar contenido con nuevo CI |

---

## 4. Scripts a Estandarizar

| Paquete | lint | type-check | test |
|---|---|---|---|
| **Backend** | ✅ existe `eslint ... --fix` | agregar script `"type-check": "tsc --noEmit"` | ✅ `jest` |
| **Frontend-web** | ✅ `eslint .` | ✅ implícito en `tsc -b` | ✅ `vitest run` |
| **Frontend-mobile** | agregar `"lint": "eslint \"src/**/*.{ts,tsx}\""` | agregar `"type-check": "tsc --noEmit"` | ✅ `jest` |
| **Shared** | agregar `"lint": "eslint \"src/**/*.ts\""` | ✅ `tsc --noEmit` | ✅ `jest` |

---

## 5. Notificaciones

```
  CI/CD Failure
  ┌──────────────────────────────────────┐
  │  ❌ Pipeline failed                   │
  │                                      │
  │  Repo:     uniconnect/monorepo       │
  │  Branch:   feat/xyz                  │
  │  Job:      quality (backend)         │
  │  Step:     npm run test              │
  │  Run:      https://github.com/.../1  │
  │  Author:   @username                 │
  └──────────────────────────────────────┘
```

Implementación via `npx github:uniconnect/slack-notify-action` o acción nativa:

```yaml
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v2
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK }}
    webhook-type: incoming-webhook
    payload: |
      {"text": "❌ Pipeline failed in ${{ github.workflow }}: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"}
```

---

## 6. Estrategia de Rollback

| Artefacto | Método de Rollback | Comando |
|---|---|---|
| **Backend (Fly.io)** | Deploy versión anterior | `flyctl deploy --remote-only --image <prev-image>` |
| **Web (Fly.io)** | Deploy versión anterior | `flyctl deploy --remote-only --image <prev-image>` |
| **Mobile (EAS)** | Build anterior en EAS | Re-descargar desde dashboard EAS, o rebuild con `--profile preview --existing-build-id` |

Rollback automatizado vía GitHub workflow manual:

```yaml
name: Rollback
on: workflow_dispatch
  inputs:
    app:
      description: 'App to rollback (backend/web/mobile)'
      required: true
    version:
      description: 'Previous version/image tag'
      required: true
jobs:
  rollback:
    steps:
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --image ${{ inputs.version }} --remote-only
        if: inputs.app != 'mobile'
      # Mobile rollback via dispatch comment
```

---

## 7. Gestión de Secretos

| Secreto | Usado en | Origen |
|---|---|---|
| `FLY_API_TOKEN` | CD Backend + Web | Fly.io dashboard → tokens |
| `EXPO_TOKEN` | CD Mobile | Expo.dev → settings → tokens |
| `SLACK_WEBHOOK` | CI + CD (notificaciones) | Slack → apps → webhooks |
| `CODECOV_TOKEN` | CI (opcional) | codecov.io |

Todos los secretos se configuran en: GitHub → Settings → Secrets and variables → Actions

---

## 8. Salud (Health Check)

```yaml
# Backend health endpoint (ya existe vía NestJS)
GET /api/health → 200 { "status": "ok", "timestamp": "..." }
```

El health check en el CD:

```yaml
- name: Health check
  run: |
    curl --fail --retry 6 --retry-delay 10 \
      https://uniconnect-backend-core-black-wave-3099.fly.dev/api/health
```
