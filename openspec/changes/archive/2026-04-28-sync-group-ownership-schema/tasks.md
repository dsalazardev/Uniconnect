## 1. Migración de Base de Datos

- [x] 1.1 Ejecutar `npx prisma migrate dev --name add_pending_owner_id_to_group` en el directorio `Backend/`
- [x] 1.2 Verificar que se creó el archivo de migración en `Backend/prisma/migrations/*_add_pending_owner_id_to_group/migration.sql`
- [x] 1.3 Confirmar que la migración SQL contiene `ALTER TABLE "group" ADD COLUMN "pending_owner_id" INTEGER` y la FK correspondiente

## 2. Verificación del Cliente Prisma

- [x] 2.1 Confirmar que `Backend/node_modules/.prisma/client/schema.prisma` contiene `pending_owner_id Int?` y la relación `"GroupPendingOwner"` en el modelo `group`
- [x] 2.2 Confirmar que `Backend/node_modules/.prisma/client/index.d.ts` tiene fecha posterior al 28 de abril de 2026

## 3. Verificación de Tipos TypeScript

- [x] 3.1 Ejecutar `npx tsc --noEmit` en `Backend/` y filtrar por `pending_owner_id`
- [x] 3.2 Confirmar que la salida no contiene ningún error con `pending_owner_id` (0 errores TS2353/TS2339 relacionados)
