## Context

El campo `pending_owner_id Int?` fue añadido manualmente a `prisma/schema/group.prisma` el 28 de abril de 2026 para soportar la transferencia de propiedad de grupos (US-O01). La relación inversa `groups_pending_owner group[] @relation("GroupPendingOwner")` también fue añadida a `user.prisma`. Sin embargo, nunca se ejecutó `prisma migrate dev`, por lo que:

- La columna no existe en PostgreSQL.
- El cliente generado (`node_modules/.prisma/client/`, fecha: 26 abr) no conoce el campo.
- `groups.service.ts` produce 15 errores TS2353/TS2339 al referenciar `pending_owner_id`.

El proyecto usa Prisma 7.4.x con schema multi-archivo en `prisma/schema/` y `prisma.config.ts` apuntando a ese directorio.

## Goals / Non-Goals

**Goals:**
- Crear la columna `pending_owner_id` en la tabla `group` de PostgreSQL mediante una migración versionada.
- Regenerar el Prisma Client para que los tipos TypeScript reflejen el campo.
- Eliminar los 15 errores de compilación en `groups.service.ts`.
- Preservar todos los registros existentes de grupos (campo nullable).

**Non-Goals:**
- Modificar archivos `.prisma` (ya son correctos).
- Modificar código de aplicación (service, controller, DTOs, guards).
- Agregar tests nuevos (los existentes ya cubren la lógica de transferencia).
- Cambiar la lógica de negocio de transferencia de ownership.

## Decisions

### D1: `prisma migrate dev` en lugar de `prisma generate` solo

**Decisión**: Ejecutar `prisma migrate dev --name add_pending_owner_id_to_group` en lugar de solo `prisma generate`.

**Rationale**: `prisma generate` solo actualizaría los tipos TypeScript pero la columna no existiría en PostgreSQL. En runtime, cualquier query que use `pending_owner_id` fallaría con `column "pending_owner_id" does not exist`. Este es exactamente el patrón de fallo documentado en AGENTS.md para el bug de eventos de Abril 2026. `migrate dev` crea la columna Y regenera el cliente en un solo paso atómico.

**Alternativa descartada**: `prisma db push` — no genera archivo de migración versionado, lo que rompe el historial de migraciones del proyecto y no es reproducible en otros entornos (Render, CI).

### D2: Columna nullable sin valor por defecto

**Decisión**: El campo se define como `Int?` (nullable) sin `@default`.

**Rationale**: Los grupos existentes no tienen transferencia pendiente. `NULL` es el estado correcto para "sin transferencia en curso". Un default de `0` o `-1` sería semánticamente incorrecto y requeriría lógica adicional para distinguirlo de un ID real.

### D3: Verificación post-migración con `tsc --noEmit`

**Decisión**: Verificar la eliminación de errores TS ejecutando `npx tsc --noEmit` y filtrando por `pending_owner_id` después de la migración.

**Rationale**: Confirma objetivamente que el cliente fue regenerado correctamente y que los 15 errores desaparecieron, sin necesidad de un build completo.

## Risks / Trade-offs

- **[Riesgo] Base de datos no accesible** → La migración falla si `DATABASE_URL` no está configurada o la BD no está disponible. Mitigación: verificar conexión antes de ejecutar. El schema fuente no se modifica, por lo que es seguro reintentar.
- **[Riesgo] Otros errores TS no relacionados** → El `tsc --noEmit` reportará 67 errores adicionales (tests con `groupId` en `StudyGroupEvent`, mocks mal tipados). Estos son pre-existentes y fuera del scope. Mitigación: filtrar la verificación específicamente por `pending_owner_id`.
- **[Trade-off] `migrate dev` vs `migrate deploy`** → `migrate dev` es para desarrollo local y puede pedir confirmación interactiva. En CI/producción se usa `migrate deploy`. Para este fix local, `migrate dev` es el comando correcto.
