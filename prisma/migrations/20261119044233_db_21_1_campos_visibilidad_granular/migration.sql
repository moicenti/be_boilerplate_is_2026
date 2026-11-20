-- CreateTable
CREATE TABLE "perfil_directorio" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "nombre" VARCHAR(80),
    "apellido" VARCHAR(80),
    "telefono" VARCHAR(25),
    "visible_en_directorio" BOOLEAN NOT NULL DEFAULT true,
    "mostrar_nombre" BOOLEAN NOT NULL DEFAULT true,
    "mostrar_unidad" BOOLEAN NOT NULL DEFAULT true,
    "mostrar_correo" BOOLEAN NOT NULL DEFAULT false,
    "mostrar_telefono" BOOLEAN NOT NULL DEFAULT false,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "perfil_directorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_directorio_user_id_key" ON "perfil_directorio"("user_id");

-- CreateIndex
CREATE INDEX "perfil_directorio_apellido_idx" ON "perfil_directorio"("apellido");

-- CreateIndex
CREATE INDEX "perfil_directorio_visible_en_directorio_idx" ON "perfil_directorio"("visible_en_directorio");

-- AddForeignKey
ALTER TABLE "perfil_directorio" ADD CONSTRAINT "perfil_directorio_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
