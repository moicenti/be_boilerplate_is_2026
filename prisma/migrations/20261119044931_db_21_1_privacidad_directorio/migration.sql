/*
  Warnings:

  - You are about to drop the `perfil_directorio` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "perfil_directorio" DROP CONSTRAINT "perfil_directorio_user_id_fkey";

-- DropTable
DROP TABLE "perfil_directorio";

-- CreateTable
CREATE TABLE "privacidad_directorio" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "nombre" VARCHAR(100),
    "apellido" VARCHAR(80),
    "telefono" VARCHAR(20),
    "visible_global" BOOLEAN NOT NULL DEFAULT false,
    "mostrar_telefono" BOOLEAN NOT NULL DEFAULT false,
    "mostrar_correo" BOOLEAN NOT NULL DEFAULT false,
    "mostrar_nombre" BOOLEAN NOT NULL DEFAULT true,
    "mostrar_unidad" BOOLEAN NOT NULL DEFAULT true,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "privacidad_directorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "privacidad_directorio_user_id_key" ON "privacidad_directorio"("user_id");

-- CreateIndex
CREATE INDEX "privacidad_directorio_apellido_idx" ON "privacidad_directorio"("apellido");

-- CreateIndex
CREATE INDEX "privacidad_directorio_visible_global_idx" ON "privacidad_directorio"("visible_global");

-- AddForeignKey
ALTER TABLE "privacidad_directorio" ADD CONSTRAINT "privacidad_directorio_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
