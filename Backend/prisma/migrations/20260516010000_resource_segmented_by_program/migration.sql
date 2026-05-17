-- Migración: cambiar recursos de grupo-scope a programa-scope
-- id_group pasa a opcional; id_program se convierte en FK primaria

-- 1. Hacer id_group nullable
ALTER TABLE "resources" ALTER COLUMN "id_group" DROP NOT NULL;

-- 2. Actualizar el ON DELETE de id_group (recrear constraint)
ALTER TABLE "resources" DROP CONSTRAINT IF EXISTS "resources_id_group_fkey";
ALTER TABLE "resources" ADD CONSTRAINT "resources_id_group_fkey"
    FOREIGN KEY ("id_group") REFERENCES "group"("id_group") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Agregar columna id_program
ALTER TABLE "resources" ADD COLUMN "id_program" INTEGER;

-- 4. Poblar id_program desde el grupo (para registros existentes)
UPDATE "resources" r
SET "id_program" = (
    SELECT c.id_program
    FROM "group" g
    JOIN "course" c ON g.id_course = c.id_course
    WHERE g.id_group = r.id_group
)
WHERE r.id_group IS NOT NULL;

-- 5. Hacer id_program NOT NULL
ALTER TABLE "resources" ALTER COLUMN "id_program" SET NOT NULL;

-- 6. Agregar FK y índice para id_program
ALTER TABLE "resources" ADD CONSTRAINT "resources_id_program_fkey"
    FOREIGN KEY ("id_program") REFERENCES "program"("id_program") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "resources_id_program_idx" ON "resources"("id_program");
