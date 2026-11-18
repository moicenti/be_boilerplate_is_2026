import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '@PrismaClient';

export class FilterIncidenciaDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, enum: Priority })
  @IsOptional()
  @IsEnum(Priority, { message: 'Prioridad inválida' })
  priority?: Priority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit?: string;
}