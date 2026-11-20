import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const MAX_RUNS_PAGE_SIZE = 100;

export class ListGenerationRunsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pagina debe ser un número entero' })
  @Min(1, { message: 'pagina debe ser 1 o mayor' })
  pagina: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: MAX_RUNS_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'tamano debe ser un número entero' })
  @Min(1, { message: `tamano debe estar entre 1 y ${MAX_RUNS_PAGE_SIZE}` })
  @Max(MAX_RUNS_PAGE_SIZE, {
    message: `tamano debe estar entre 1 y ${MAX_RUNS_PAGE_SIZE}`,
  })
  tamano: number = 20;
}
