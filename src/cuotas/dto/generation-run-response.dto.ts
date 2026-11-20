import { ApiProperty } from '@nestjs/swagger';
import { GenerationOrigin, GenerationRunStatus } from '@PrismaClient';
import { toZonedIso } from '@CommonAreas/utils';
import type { RunErrorWithUnit, RunWithUser } from '../repositories/index.js';
import type { ExecutionView } from '../services/index.js';

export class GenerationErrorDto {
  @ApiProperty({ format: 'uuid' })
  unidadId!: string;

  @ApiProperty({ example: 'C-119' })
  codigoUnidad!: string;

  @ApiProperty({ example: 'Unidad sin responsable: requiere revisión.' })
  causa!: string;

  static fromEntity(error: RunErrorWithUnit): GenerationErrorDto {
    return {
      unidadId: error.unitId,
      codigoUnidad: error.unit.code,
      causa: error.cause,
    };
  }
}

export class GenerationExecutionResponseDto {
  @ApiProperty({ example: 31 })
  ejecucionId!: number;

  @ApiProperty({ example: '2026-11' })
  periodo!: string;

  @ApiProperty({
    enum: [GenerationRunStatus.COMPLETADA, GenerationRunStatus.CON_ERRORES],
  })
  estado!: GenerationRunStatus;

  @ApiProperty({ example: 47 })
  creadas!: number;

  @ApiProperty({
    example: 0,
    description: 'Ya generadas antes u omitidas por la política de la regla.',
  })
  omitidas!: number;

  @ApiProperty({ type: GenerationErrorDto, isArray: true })
  errores!: GenerationErrorDto[];

  @ApiProperty({
    example: 4700.0,
    description: 'Suma de las cuotas creadas en esta ejecución.',
  })
  montoTotal!: number;

  static fromView({
    run,
    errors,
  }: ExecutionView): GenerationExecutionResponseDto {
    return {
      ejecucionId: run.id,
      periodo: run.period,
      estado: run.status,
      creadas: run.created,
      omitidas: run.omitted,
      errores: errors.map((e) => GenerationErrorDto.fromEntity(e)),
      montoTotal: run.totalAmount.toNumber(),
    };
  }
}

export class GenerationRunItemDto {
  @ApiProperty({ example: 31 })
  id!: number;

  @ApiProperty({
    example: '2026-11-05T10:12:00-06:00',
    description: 'Inicio de la ejecución',
  })
  fecha!: string;

  @ApiProperty({ enum: GenerationOrigin })
  origen!: GenerationOrigin;

  @ApiProperty({
    example: 'admin@example.com',
    nullable: true,
    type: String,
    description: 'Quien la confirmó; nulo en las automáticas',
  })
  usuario!: string | null;

  @ApiProperty({ example: '2026-11' })
  periodo!: string;

  @ApiProperty({ enum: GenerationRunStatus })
  estado!: GenerationRunStatus;

  @ApiProperty({ example: 47 })
  creadas!: number;

  @ApiProperty({ example: 0 })
  omitidas!: number;

  @ApiProperty({ example: 1 })
  conError!: number;

  static fromEntity(run: RunWithUser, timeZone: string): GenerationRunItemDto {
    return {
      id: run.id,
      fecha: toZonedIso(run.startedAt, timeZone),
      origen: run.origin,
      usuario: run.user?.email ?? null,
      periodo: run.period,
      estado: run.status,
      creadas: run.created,
      omitidas: run.omitted,
      conError: run.failed,
    };
  }
}

export class GenerationRunPageResponseDto {
  @ApiProperty({ example: 2 })
  total!: number;

  @ApiProperty({ example: 1 })
  pagina!: number;

  @ApiProperty({ example: 20 })
  tamano!: number;

  @ApiProperty({ type: GenerationRunItemDto, isArray: true })
  items!: GenerationRunItemDto[];
}
