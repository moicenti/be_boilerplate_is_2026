-- CreateEnum
CREATE TYPE "AssemblyType" AS ENUM ('ORDINARIA', 'EXTRAORDINARIA');

-- CreateEnum
CREATE TYPE "AssemblyModality" AS ENUM ('PRESENCIAL', 'VIRTUAL', 'HIBRIDA');

-- CreateTable
CREATE TABLE "asambleas" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "folio" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AssemblyType" NOT NULL,
    "modality" "AssemblyModality" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asambleas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_agenda" (
    "id" UUID NOT NULL,
    "assembly_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "puntos_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas_votacion" (
    "id" UUID NOT NULL,
    "assembly_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "opens_at" TIMESTAMP(3) NOT NULL,
    "closes_at" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "temas_votacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones_votacion" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "opciones_votacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_number_key" ON "asambleas"("number");

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_folio_key" ON "asambleas"("folio");

-- CreateIndex
CREATE INDEX "asambleas_starts_at_idx" ON "asambleas"("starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "puntos_agenda_assembly_id_position_key" ON "puntos_agenda"("assembly_id", "position");

-- CreateIndex
CREATE INDEX "temas_votacion_opens_at_closes_at_idx" ON "temas_votacion"("opens_at", "closes_at");

-- CreateIndex
CREATE UNIQUE INDEX "temas_votacion_assembly_id_position_key" ON "temas_votacion"("assembly_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "opciones_votacion_topic_id_position_key" ON "opciones_votacion"("topic_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "opciones_votacion_topic_id_text_key" ON "opciones_votacion"("topic_id", "text");

-- AddForeignKey
ALTER TABLE "asambleas" ADD CONSTRAINT "asambleas_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_agenda" ADD CONSTRAINT "puntos_agenda_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "asambleas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temas_votacion" ADD CONSTRAINT "temas_votacion_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "asambleas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_votacion" ADD CONSTRAINT "opciones_votacion_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "temas_votacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "asambleas" ADD CONSTRAINT "asambleas_horario_check" CHECK ("ends_at" > "starts_at");

-- AddCheckConstraint
ALTER TABLE "temas_votacion" ADD CONSTRAINT "temas_votacion_plazo_check" CHECK ("closes_at" > "opens_at");
