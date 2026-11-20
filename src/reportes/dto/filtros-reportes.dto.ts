import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrosReportesDto {
  @IsDateString()
  desde: string;

  @IsDateString()
  hasta: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seccion?: number;
}
