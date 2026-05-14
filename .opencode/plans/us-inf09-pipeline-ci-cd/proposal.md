# US-INF09: Pipeline de CI/CD Unificado

## Resumen Ejecutivo

Unificar y robustecer el pipeline de CI/CD del monorepo Uniconnect.
Hoy existen 3 workflows duplicados e incompletos (sin lint, sin type-check, sin cobertura).
La propuesta es un pipeline único con jobs en matrix y filtros por ruta, que valide calidad en PRs
y deploye cada artefacto a su destino.

---

## Problema

| Síntoma | Impacto |
|---|---|
| 3 workflows duplicados (Frontend/, Frontend-mobile/, Backend/) | Mantenimiento confuso, riesgo de drift |
| Sin lint ni type-check en CI | Código mal formateado o errores de tipos llegan a main |
| Sin reporte de cobertura | No se puede medir calidad de tests |
| `eas.json` vacío en raíz | Ruido en el repositorio |
| Frontend-mobile sin `lint` ni `type-check` | No hay validación local de calidad |
| Shared sin script de `lint` | Paquete compartido no se valida |
| Deploy de Frontend desde `dev` (no `main`) | Inconsistente con Backend que deploya desde `main` |
| Sin notificaciones de error en CI | Fallos silenciosos |

---

## Alcance

### Incluye

- **Saneamiento**: eliminar `eas.json` vacío de raíz, eliminar workflow duplicado `Frontend/Frontend-mobile/.github/workflows/ci-cd.yml`
- **Estandarización**: agregar scripts `lint`, `type-check`, `test` faltantes en Frontend-mobile y Shared
- **CI unificado**: workflow único `.github/workflows/ci.yml` con matrix jobs, lint → type-check → test → coverage
- **CD**: `.github/workflows/cd.yml` con jobs de deploy:
  - Backend → Fly.io (health check)
  - Web → Fly.io (Nginx)
  - Mobile → EAS Build (perfil preview)
- **Notificaciones**: Slack/Discord webhook + GitHub commit status
- **Documentación**: `CI-CD.md` con diagramas, secretos, rollback

### No Incluye

- Migración de Fly.io a otro proveedor
- EAS Submit a stores
- Tests E2E
- Cache multi-level de Docker

---

## Criterios de Aceptación

| ID | Criterio |
|---|---|
| **CA-01** | `git push` a cualquier rama dispara lint + type-check + tests en paquetes afectados (filtro por ruta) |
| **CA-02** | PR a `main` requiere lint, type-check y tests pasando para mergear |
| **CA-03** | Push a `main` en Backend deploya a Fly.io y `/api/health` responde 200 |
| **CA-04** | Push a `main` en Frontend-web deploya a Fly.io con artifact listo para Nginx |
| **CA-05** | Push a `main` en Frontend-mobile dispara EAS Build (preview) y reporta URL |
| **CA-06** | Fallo notifica por Slack/Discord con link al workflow run |
| **CA-07** | `npm run lint` y `npm run type-check` existen y funcionan en todos los paquetes |
| **CA-08** | Reporte de cobertura se publica como comment en el PR |
| **CA-09** | `eas.json` vacío eliminado, workflows duplicados limpiados |
