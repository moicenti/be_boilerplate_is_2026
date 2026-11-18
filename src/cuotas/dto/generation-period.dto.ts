import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GenerationPeriodDto {
  @ApiProperty({ example: '2026-11', description: 'Periodo AAAA-MM' })
  @IsString({ message: 'periodo debe tener el formato AAAA-MM' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'periodo debe tener el formato AAAA-MM',
  })
  periodo!: string;
}
