-- AlterTable: add column first, then the FK constraint
ALTER TABLE "group" ADD COLUMN IF NOT EXISTS "pending_owner_id" INTEGER;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_pending_owner_id_fkey" FOREIGN KEY ("pending_owner_id") REFERENCES "user"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;
