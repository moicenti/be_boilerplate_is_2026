import { ApiProperty } from '@nestjs/swagger';
import type { ExceptionReason, PreviewView } from '../services/index.js';

const EXCEPTION_REASONS: ExceptionReason[] = [
  'UNIDAD_INACTIVA',
  'SIN_RESPONSABLE',
  'SIN_MONTO',
];

export class GenerationExceptionDto {
  @ApiProperty({ format: 'uuid' })
  unidadId!: string;

  @ApiProperty({ example: 'C-119' })
  codigoUnidad!: string;

  @ApiProperty({ enum: EXCEPTION_REASONS, example: 'UNIDAD_INACTIVA' })
  motivo!: ExceptionReason;

  @ApiProperty({
    enum: ['OMITIDA', 'ERROR'],
    description:
      'Cómo contará al ejecutar, según la política de la regla: en `omitidas` o en `errores`.',
  })
  resultado!: 'OMITIDA' | 'ERROR';
}

export class GenerationPreviewResponseDto {
  @ApiProperty({ example: '2026-11' })
  periodo!: string;

  @ApiProperty({
    example: 48,
    description:
      'Unidades a las que se les crearía la cuota: lo que la ejecución devolvería en `creadas`.',
  })
  cantidadUnidades!: number;

  @ApiProperty({
    example: 4800.0,
    description: 'Suma de las cuotas que se crearían.',
  })
  montoTotal!: number;

  @ApiProperty({
    example: 0,
    description: 'Unidades que ya tienen la cuota del periodo (se omiten).',
  })
  yaGeneradas!: number;

  @ApiProperty({
    example: '2026-11-10',
    description: 'Vencimiento de las cuotas',
  })
  fechaVencimiento!: string;

  @ApiProperty({ type: GenerationExceptionDto, isArray: true })
  excepciones!: GenerationExceptionDto[];

  static fromView(view: PreviewView): GenerationPreviewResponseDto {
    return {
      periodo: view.period,
      cantidadUnidades: view.feeCount,
      montoTotal: view.totalAmount.toNumber(),
      yaGeneradas: view.alreadyGenerated,
      fechaVencimiento: view.dueDate.toISOString().slice(0, 10),
      excepciones: view.exceptions.map((e) => ({
        unidadId: e.unitId,
        codigoUnidad: e.unitCode,
        motivo: e.reason,
        resultado: e.result,
      })),
    };
  }
}
