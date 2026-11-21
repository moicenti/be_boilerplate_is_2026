import { BadRequestException } from '@nestjs/common';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * H30 · DTO Compartido para filtros de periodo y sección.
 * Reutilizado por: Resumen (H26), Morosidad (H2), Áreas Comunes (H27),
 * Incidencias (H28) y Votaciones (H29).
 */
export class FiltrosReportesDto {
  @IsDateString()
  desde!: string;

  @IsDateString()
  hasta!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seccion?: number;

  /**
   * H30 · Validación cruzada: desde <= hasta.
   * Lanza 400 FILTROS_INVALIDOS si las fechas son inválidas.
   */
  validar(): void {
    const d = new Date(this.desde);
    const h = new Date(this.hasta);

    if (Number.isNaN(d.getTime()) || Number.isNaN(h.getTime())) {
      throw new BadRequestException({
        codigo: 'FILTROS_INVALIDOS',
        mensaje: 'Las fechas deben tener formato YYYY-MM-DD',
      });
    }
    if (d > h) {
      throw new BadRequestException({
        codigo: 'FILTROS_INVALIDOS',
        mensaje: 'La fecha "desde" no puede ser mayor que "hasta"',
      });
    }
  }
}
