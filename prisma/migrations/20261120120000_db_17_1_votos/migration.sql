-- CreateTable
CREATE TABLE "votos" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,

    CONSTRAINT "votos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "votos_topic_id_idx" ON "votos"("topic_id");

-- AddForeignKey
ALTER TABLE "votos" ADD CONSTRAINT "votos_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "temas_votacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos" ADD CONSTRAINT "votos_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "opciones_votacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacion_votacion" ADD CONSTRAINT "participacion_votacion_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
