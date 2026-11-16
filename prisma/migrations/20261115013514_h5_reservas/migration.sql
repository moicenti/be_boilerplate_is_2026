-- usuario_id pasa a residente_id sin perder datos.
ALTER TABLE "reserva" RENAME COLUMN "usuario_id" TO "residente_id";
ALTER TABLE "reserva" RENAME CONSTRAINT "reserva_usuario_id_fkey" TO "reserva_residente_id_fkey";

-- unidad_id se rellena con la unidad actual del residente. Si esta migración corre después
-- de 20261115201916_fixing_unit (bases que ya tenían develop), users.unit ya no existe y se usa users.unit_id.
ALTER TABLE "reserva" ADD COLUMN "unidad_id" UUID;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'unit_id'
  ) THEN
    EXECUTE 'UPDATE "reserva" r SET "unidad_id" = u."unit_id"
      FROM "users" u WHERE u."id" = r."residente_id"';
  ELSE
    EXECUTE 'UPDATE "reserva" r SET "unidad_id" = un."id"
      FROM "users" u JOIN "units" un ON un."code" = u."unit"
      WHERE u."id" = r."residente_id"';
  END IF;
END $$;
ALTER TABLE "reserva" ALTER COLUMN "unidad_id" SET NOT NULL;

ALTER TABLE "reserva" ALTER COLUMN "estado" SET DEFAULT 'CONFIRMADA';

-- CreateIndex
CREATE INDEX "reserva_residente_id_inicio_idx" ON "reserva"("residente_id", "inicio");

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reserva" ADD CONSTRAINT "reserva_fin_posterior_inicio" CHECK ("fin" > "inicio");

-- Protección final contra reservas cruzadas, también entre requests simultáneos.
-- Las CANCELADAS no participan: su horario puede volver a reservarse.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_sin_cruce"
  EXCLUDE USING gist ("area_id" WITH =, tstzrange("inicio", "fin") WITH &&)
  WHERE ("estado" = 'CONFIRMADA');
