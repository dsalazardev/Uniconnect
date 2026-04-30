# Design: Fix Prisma Drift and Versions

## Context

**Current State**:
- Prisma CLI 7.4.1 vs @prisma/client 7.8.0 (desincronizadas)
- Campo `pending_owner_id` en tabla `group` sin foreign key constraint
- Base de datos: PostgreSQL en Aiven Cloud (producción)
- 14 migraciones históricas aplicadas correctamente

**Root Cause**:
- Commit `0731606` agregó `pending_owner_id` al schema con relación `@relation("GroupPendingOwner")`
- No se creó migración correspondiente para agregar la foreign key
- La columna existe en BD pero sin constraint de integridad referencial

**Constraints**:
- No se puede modificar manualmente archivos en `prisma/migrations/`
- Debe usarse Prisma CLI para todas las operaciones
- Base de datos en producción - cero downtime permitido
- Debe preservarse historial de migraciones

## Goals / Non-Goals

**Goals**:
- Sincronizar versiones de Prisma (CLI y client a 7.8.0)
- Crear migración para foreign key faltante
- Aplicar migración a base de datos remota
- Validar sincronización completa

**Non-Goals**:
- No modificar datos existentes en la tabla `group`
- No alterar otras tablas o relaciones
- No cambiar estructura del schema más allá de la constraint

## Decisions

### Decision 1: Actualizar Prisma CLI a 7.8.0

**Rationale**: Mantener CLI y client en la misma versión evita incompatibilidades en:
- Generación de Prisma Client
- Formato de migraciones
- Comandos de CLI (sintaxis cambió en 7.x)

**Implementation**:
```bash
npm install prisma@7.8.0 --save-dev
```

**Alternative Considered**: Downgrade de @prisma/client a 7.4.1
**Why Rejected**: 7.8.0 tiene mejoras de performance y bugfixes

### Decision 2: Usar `migrate dev --create-only` para Crear Migración

**Rationale**: 
- `--create-only` genera el archivo SQL sin aplicarlo
- Permite revisar el SQL antes de aplicar a producción
- Evita aplicación accidental a BD local

**Implementation**:
```bash
npx prisma migrate dev --name add_pending_owner_fk --create-only
```

**SQL Esperado**:
```sql
ALTER TABLE "group" 
ADD CONSTRAINT "group_pending_owner_id_fkey" 
FOREIGN KEY ("pending_owner_id") 
REFERENCES "user"("id_user") 
ON DELETE SET NULL 
ON UPDATE CASCADE;
```

### Decision 3: Aplicar con `migrate deploy` en Producción

**Rationale**:
- `migrate deploy` es el comando seguro para producción
- No requiere interacción (no-prompt)
- Registra la migración en tabla `_prisma_migrations`

**Implementation**:
```bash
npx prisma migrate deploy
```

**Safety**: La constraint NO afecta datos existentes porque:
- `pending_owner_id` es nullable
- Valores NULL son válidos con foreign key
- No hay datos huérfanos (campo recién agregado)

### Decision 4: Validar con `migrate diff`

**Rationale**: Confirmar que no quede drift después de aplicar

**Implementation**:
```bash
npx prisma migrate diff --from-schema prisma/schema --to-config-datasource
```

**Expected Output**: Sin diferencias (output vacío)

## Risks / Trade-offs

### Risk 1: Migración Falla en Producción
**Risk**: La constraint podría fallar si hay datos huérfanos
**Mitigation**: 
- Validar datos antes: `SELECT pending_owner_id FROM "group" WHERE pending_owner_id IS NOT NULL AND pending_owner_id NOT IN (SELECT id_user FROM "user")`
- Si hay datos huérfanos, limpiarlos primero: `UPDATE "group" SET pending_owner_id = NULL WHERE ...`

### Risk 2: Downtime Durante Aplicación
**Risk**: Lock de tabla durante ALTER TABLE
**Mitigation**: 
- PostgreSQL permite ALTER TABLE sin lock exclusivo para agregar FK
- Operación es instantánea (tabla pequeña)
- No hay tráfico bloqueado

### Risk 3: Incompatibilidad de Versiones Durante Actualización
**Risk**: Cambio de versión podría romper generación de cliente
**Mitigation**:
- Actualizar primero, luego regenerar cliente
- Ejecutar tests después de regenerar
- Rollback disponible vía npm

## Migration Plan

**Pre-deployment Validation**:
1. Verificar que no hay datos huérfanos en `pending_owner_id`
2. Backup de base de datos (Aiven hace backups automáticos)
3. Ejecutar en ambiente local primero

**Deployment Steps**:
1. Actualizar Prisma CLI: `npm install prisma@7.8.0 --save-dev`
2. Crear migración: `npx prisma migrate dev --name add_pending_owner_fk --create-only`
3. Revisar SQL generado en `prisma/migrations/[timestamp]_add_pending_owner_fk/migration.sql`
4. Aplicar migración: `npx prisma migrate deploy`
5. Regenerar cliente: `npx prisma generate`
6. Validar: `npx prisma migrate status` y `npx prisma migrate diff`

**Rollback Strategy**:
```bash
# Si la migración falla
npx prisma migrate resolve --rolled-back [migration_name]

# Si necesitas revertir la constraint
ALTER TABLE "group" DROP CONSTRAINT "group_pending_owner_id_fkey";
```

**Validation**:
- Pre: `npx prisma migrate diff` muestra foreign key faltante
- Post: `npx prisma migrate diff` no muestra diferencias
- Post: `npx prisma migrate status` reporta "up to date"

## Open Questions

None - la solución es directa y sigue las mejores prácticas de Prisma.
