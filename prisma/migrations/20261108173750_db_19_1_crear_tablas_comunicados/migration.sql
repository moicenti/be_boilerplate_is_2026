-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'RESIDENTE', 'SEGURIDAD');

-- CreateEnum
CREATE TYPE "CategoriaComunicado" AS ENUM ('MANTENIMIENTO', 'SEGURIDAD', 'ADMINISTRATIVO');

-- CreateEnum
CREATE TYPE "PrioridadComunicado" AS ENUM ('INFORMATIVO', 'IMPORTANTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "AudienciaTipo" AS ENUM ('TODO_EL_CONDOMINIO', 'POR_TORRE', 'POR_SECCION');

-- CreateEnum
CREATE TYPE "EstadoComunicado" AS ENUM ('PUBLICADO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "rol" "Rol" NOT NULL DEFAULT 'RESIDENTE',
ADD COLUMN     "unit" TEXT;

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "folio" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Abierto',
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_photos" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_id" UUID NOT NULL,

    CONSTRAINT "report_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicado_oficial" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(120) NOT NULL,
    "cuerpo" VARCHAR(2000) NOT NULL,
    "categoria" "CategoriaComunicado" NOT NULL,
    "prioridad" "PrioridadComunicado" NOT NULL,
    "audiencia_tipo" "AudienciaTipo" NOT NULL,
    "audiencia_target" VARCHAR(50),
    "estado" "EstadoComunicado" NOT NULL DEFAULT 'PUBLICADO',
    "fecha_publicacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emisor_id" UUID NOT NULL,

    CONSTRAINT "comunicado_oficial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicado_adjunto" (
    "id" SERIAL NOT NULL,
    "comunicado_id" INTEGER NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "tipo_mime" VARCHAR(50) NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comunicado_adjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lectura_comunicado" (
    "id" SERIAL NOT NULL,
    "comunicado_id" INTEGER NOT NULL,
    "residente_id" UUID NOT NULL,
    "fecha_lectura" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lectura_comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_folio_key" ON "reports"("folio");

-- CreateIndex
CREATE INDEX "report_photos_report_id_idx" ON "report_photos"("report_id");

-- CreateIndex
CREATE INDEX "comunicado_adjunto_comunicado_id_idx" ON "comunicado_adjunto"("comunicado_id");

-- CreateIndex
CREATE UNIQUE INDEX "lectura_comunicado_comunicado_id_residente_id_key" ON "lectura_comunicado"("comunicado_id", "residente_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_photos" ADD CONSTRAINT "report_photos_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado_oficial" ADD CONSTRAINT "comunicado_oficial_emisor_id_fkey" FOREIGN KEY ("emisor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado_adjunto" ADD CONSTRAINT "comunicado_adjunto_comunicado_id_fkey" FOREIGN KEY ("comunicado_id") REFERENCES "comunicado_oficial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectura_comunicado" ADD CONSTRAINT "lectura_comunicado_comunicado_id_fkey" FOREIGN KEY ("comunicado_id") REFERENCES "comunicado_oficial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectura_comunicado" ADD CONSTRAINT "lectura_comunicado_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
