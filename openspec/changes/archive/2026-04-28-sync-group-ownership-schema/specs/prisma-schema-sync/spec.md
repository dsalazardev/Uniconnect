## ADDED Requirements

### Requirement: Migración de columna pending_owner_id
El sistema SHALL tener la columna `pending_owner_id` físicamente presente en la tabla `group` de PostgreSQL, con una FK hacia `user(id_user)`, antes de que el backend pueda arrancar sin errores de runtime.

#### Scenario: Migración ejecutada exitosamente
- **WHEN** se ejecuta `npx prisma migrate dev --name add_pending_owner_id_to_group` en el directorio `Backend/`
- **THEN** se crea un archivo de migración SQL en `prisma/migrations/` con el nombre `*_add_pending_owner_id_to_group`
- **THEN** la columna `pending_owner_id` existe en la tabla `group` de PostgreSQL como `INTEGER NULL`
- **THEN** existe una FK de `group.pending_owner_id` hacia `user.id_user`

#### Scenario: Registros existentes no afectados
- **WHEN** la migración se aplica sobre una base de datos con grupos existentes
- **THEN** todos los registros existentes tienen `pending_owner_id = NULL`
- **THEN** ningún registro existente es modificado ni eliminado

### Requirement: Regeneración del Prisma Client
El Prisma Client generado SHALL incluir el campo `pending_owner_id` en los tipos TypeScript del modelo `group` después de la migración.

#### Scenario: Cliente regenerado con tipos correctos
- **WHEN** `prisma migrate dev` completa exitosamente
- **THEN** `node_modules/.prisma/client/index.d.ts` contiene `pending_owner_id` en el tipo `group`
- **THEN** `node_modules/.prisma/client/schema.prisma` refleja el modelo `group` con `pending_owner_id Int?` y la relación `"GroupPendingOwner"`

### Requirement: Eliminación de errores TypeScript
El proyecto SHALL compilar sin los errores TS2353 y TS2339 relacionados con `pending_owner_id` en `src/groups/groups.service.ts`.

#### Scenario: Verificación de compilación post-migración
- **WHEN** se ejecuta `npx tsc --noEmit` en el directorio `Backend/` después de la migración
- **THEN** no aparece ningún error que contenga `pending_owner_id` en la salida
- **THEN** los 15 errores TS2353/TS2339 previamente presentes en `groups.service.ts` han desaparecido
