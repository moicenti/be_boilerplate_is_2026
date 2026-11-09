-- CreateEnum
CREATE TYPE "CategoriaComunicado" AS ENUM ('MANTENIMIENTO', 'SEGURIDAD', 'ADMINISTRATIVO');

-- CreateEnum
CREATE TYPE "PrioridadComunicado" AS ENUM ('INFORMATIVO', 'IMPORTANTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "AudienciaTipo" AS ENUM ('TODO_EL_CONDOMINIO', 'POR_TORRE', 'POR_SECCION');

-- CreateEnum
CREATE TYPE "EstadoComunicado" AS ENUM ('PUBLICADO');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SEGURIDAD';

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
CREATE INDEX "comunicado_adjunto_comunicado_id_idx" ON "comunicado_adjunto"("comunicado_id");

-- CreateIndex
CREATE UNIQUE INDEX "lectura_comunicado_comunicado_id_residente_id_key" ON "lectura_comunicado"("comunicado_id", "residente_id");

-- AddForeignKey
ALTER TABLE "comunicado_oficial" ADD CONSTRAINT "comunicado_oficial_emisor_id_fkey" FOREIGN KEY ("emisor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado_adjunto" ADD CONSTRAINT "comunicado_adjunto_comunicado_id_fkey" FOREIGN KEY ("comunicado_id") REFERENCES "comunicado_oficial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectura_comunicado" ADD CONSTRAINT "lectura_comunicado_comunicado_id_fkey" FOREIGN KEY ("comunicado_id") REFERENCES "comunicado_oficial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectura_comunicado" ADD CONSTRAINT "lectura_comunicado_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

