# Proposal: Fix Prisma Drift and Versions

## Problem Statement

La auditoría de integridad de Prisma detectó dos problemas críticos:

1. **Divergencia de Schema**: La tabla `group` tiene una foreign key faltante en la base de datos remota
   - Schema local define: `pending_owner_id` con relación a `user.id_user`
   - Base de datos remota: Tiene la columna pero NO la constraint de foreign key
   - Causa: Commit `0731606` agregó el campo sin crear migración correspondiente

2. **Desincronización de Versiones**: Versiones incompatibles de Prisma
   - `prisma` CLI: 7.4.1
   - `@prisma/client`: 7.8.0
   - Riesgo: Incompatibilidades en generación de cliente y migraciones

## Proposed Solution

Sincronizar versiones de Prisma y crear migración para agregar la foreign key faltante:

1. **Actualizar Prisma CLI** a 7.8.0 para igualar con @prisma/client
2. **Crear migración** para agregar constraint `group_pending_owner_id_fkey`
3. **Aplicar migración** a base de datos remota en Aiven Cloud
4. **Regenerar Prisma Client** con versiones sincronizadas
5. **Validar** que no quede drift entre schema y BD

## Success Criteria

- Versiones sincronizadas: `prisma@7.8.0` y `@prisma/client@7.8.0`
- Foreign key `group_pending_owner_id_fkey` creada en base de datos
- `npx prisma migrate status` reporta "Database schema is up to date!"
- `npx prisma migrate diff` no muestra diferencias
- Prisma Client regenerado con versiones correctas

## Impact

- **Risk**: 🟡 Media - Requiere modificación de base de datos en producción
- **Scope**: 2 archivos (package.json, nueva migración)
- **Rollback**: Posible vía `prisma migrate resolve --rolled-back`
- **Downtime**: Cero - La constraint no afecta datos existentes
