-- CreateEnum
CREATE TYPE "TipoContenido" AS ENUM ('ENLACE', 'DOCUMENTO', 'VIDEO', 'IMAGEN', 'ARTICULO', 'OTRO');

-- CreateTable
CREATE TABLE "resources" (
    "id_resource"      SERIAL NOT NULL,
    "id_group"         INTEGER NOT NULL,
    "created_by"       INTEGER NOT NULL,
    "url_externa"      VARCHAR(2048),
    "titulo"           VARCHAR(500) NOT NULL,
    "descripcion"      VARCHAR(2000),
    "imagen_preview"   VARCHAR(2048),
    "tipo_contenido"   "TipoContenido" NOT NULL DEFAULT 'ENLACE',
    "rendered_content" TEXT,
    "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id_resource")
);

-- CreateTable
CREATE TABLE "resource_tags" (
    "id_tag"      SERIAL NOT NULL,
    "id_resource" INTEGER NOT NULL,
    "etiqueta"    VARCHAR(100) NOT NULL,

    CONSTRAINT "resource_tags_pkey" PRIMARY KEY ("id_tag")
);

-- CreateTable
CREATE TABLE "resource_ratings" (
    "id_rating"   SERIAL NOT NULL,
    "id_resource" INTEGER NOT NULL,
    "id_user"     INTEGER NOT NULL,
    "valor"       INTEGER NOT NULL,

    CONSTRAINT "resource_ratings_pkey" PRIMARY KEY ("id_rating")
);

-- CreateTable
CREATE TABLE "resource_comments" (
    "id_comment"  SERIAL NOT NULL,
    "id_resource" INTEGER NOT NULL,
    "id_user"     INTEGER NOT NULL,
    "contenido"   VARCHAR(1000) NOT NULL,
    "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_comments_pkey" PRIMARY KEY ("id_comment")
);

-- CreateIndex
CREATE INDEX "resources_id_group_idx"        ON "resources"("id_group");
CREATE INDEX "resources_created_by_idx"      ON "resources"("created_by");
CREATE INDEX "resources_tipo_contenido_idx"  ON "resources"("tipo_contenido");

-- CreateIndex (unique rating per user per resource)
CREATE UNIQUE INDEX "resource_ratings_id_resource_id_user_key" ON "resource_ratings"("id_resource", "id_user");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_id_group_fkey"
    FOREIGN KEY ("id_group") REFERENCES "group"("id_group") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resources" ADD CONSTRAINT "resources_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_id_resource_fkey"
    FOREIGN KEY ("id_resource") REFERENCES "resources"("id_resource") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resource_ratings" ADD CONSTRAINT "resource_ratings_id_resource_fkey"
    FOREIGN KEY ("id_resource") REFERENCES "resources"("id_resource") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resource_ratings" ADD CONSTRAINT "resource_ratings_id_user_fkey"
    FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resource_comments" ADD CONSTRAINT "resource_comments_id_resource_fkey"
    FOREIGN KEY ("id_resource") REFERENCES "resources"("id_resource") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resource_comments" ADD CONSTRAINT "resource_comments_id_user_fkey"
    FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
