import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class BuscarDirectorioDto {
  @ApiPropertyOptional({
    example: 'A-304',
    description: 'Búsqueda en tiempo real por número de unidad, nombre o apellido',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({
    example: 'TODOS',
    enum: ['TODOS', 'CON_CONTACTO', 'MI_PERFIL'],
    description: 'Filtro rápido por pestaña de la vista',
  })
  @IsOptional()
  @IsIn(['TODOS', 'CON_CONTACTO', 'MI_PERFIL'])
  filtro?: 'TODOS' | 'CON_CONTACTO' | 'MI_PERFIL';

  @ApiPropertyOptional({
    example: 'Torre A',
    description: 'Filtro opcional por torre',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  torre?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  tamano?: number = 10;
}