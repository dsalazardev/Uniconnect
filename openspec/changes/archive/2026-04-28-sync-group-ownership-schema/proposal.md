## Why

El campo `pending_owner_id` fue agregado al schema Prisma (`prisma/schema/group.prisma`) para soportar la transferencia de propiedad de grupos (US-O01), pero nunca se ejecutó la migración correspondiente ni se regeneró el cliente. Esto produce 15 errores TypeScript (TS2353/TS2339) en `groups.service.ts` y causaría un fallo en runtime al intentar usar la funcionalidad de transferencia.

## What Changes

- Ejecutar `prisma migrate dev` para crear físicamente la columna `pending_owner_id` en la tabla `group` de PostgreSQL.
- El cliente Prisma se regenera automáticamente como parte del proceso de migración, eliminando los 15 errores TS.
- No se modifica ningún archivo `.prisma` ni código de aplicación.

## Capabilities

### New Capabilities

- `prisma-schema-sync`: Sincronización entre el schema Prisma fuente, la base de datos PostgreSQL y el cliente TypeScript generado para el campo `pending_owner_id` en el modelo `group`.

### Modified Capabilities

<!-- No hay cambios de requisitos en specs existentes. Solo infraestructura de datos. -->

## Impact

- **Base de datos**: Nueva columna `pending_owner_id INT NULL` en la tabla `group` con FK hacia `user(id_user)`.
- **Prisma Client**: `node_modules/.prisma/client/` regenerado con tipos actualizados para el modelo `group`.
- **TypeScript**: 15 errores TS2353/TS2339 en `src/groups/groups.service.ts` resueltos.
- **Registros existentes**: Sin impacto — el campo es `Int?` (nullable), todos los grupos existentes tendrán `pending_owner_id = NULL`.
- **Sin cambios en**: código de aplicación, DTOs, controllers, guards ni tests.
