import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Matches, Max, Min } from 'class-validator';

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleDto {
  @ApiProperty({ minimum: 0, maximum: 6, example: 6, description: '0 = domingo … 6 = sábado' })
  @IsInt({ message: 'diaSemana debe ser un número entero' })
  @Min(0, { message: 'diaSemana debe estar entre 0 y 6' })
  @Max(6, { message: 'diaSemana debe estar entre 0 y 6' })
  diaSemana!: number;

  @ApiProperty({ example: '09:00' })
  @Matches(TIME_PATTERN, { message: 'horaApertura debe tener el formato HH:mm' })
  horaApertura!: string;

  @ApiProperty({ example: '22:00' })
  @Matches(TIME_PATTERN, { message: 'horaCierre debe tener el formato HH:mm' })
  horaCierre!: string;
}
