import { ApiProperty } from '@nestjs/swagger';
import {
  FeeAmountType,
  FeeRuleScope,
  FeeRuleStatus,
  InactiveUnitPolicy,
  UnitType,
} from '@PrismaClient';
import { toZonedIso } from '@CommonAreas/utils';
import type { FeeRuleWithConfig } from '../repositories/index.js';

class TypeAmountResponseDto {
  @ApiProperty({ enum: UnitType })
  tipo!: UnitType;

  @ApiProperty({ example: 100.0 })
  monto!: number;
}

export class FeeRuleResponseDto {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ enum: FeeRuleStatus })
  estado!: FeeRuleStatus;

  @ApiProperty({ example: 'Mantenimiento' })
  concepto!: string;

  @ApiProperty({ enum: FeeAmountType })
  tipoMonto!: FeeAmountType;

  @ApiProperty({ example: 100.0, nullable: true, type: Number })
  monto!: number | null;

  @ApiProperty({ type: [TypeAmountResponseDto] })
  montosPorTipo!: TypeAmountResponseDto[];

  @ApiProperty({ example: 1 })
  diaGeneracion!: number;

  @ApiProperty({ example: 10 })
  diaVencimiento!: number;

  @ApiProperty({ enum: FeeRuleScope })
  alcance!: FeeRuleScope;

  @ApiProperty({ example: null, nullable: true, type: String })
  alcanceValor!: string | null;

  @ApiProperty({ type: [String], format: 'uuid' })
  unidadIds!: string[];

  @ApiProperty({ enum: InactiveUnitPolicy })
  politicaInactivas!: InactiveUnitPolicy;

  @ApiProperty({
    example: 48,
    description: 'Unidades que abarca hoy el alcance',
  })
  unidadesAplicables!: number;

  @ApiProperty({ example: '2026-11-05T09:00:00-06:00' })
  creadoEn!: string;

  @ApiProperty({ example: '2026-11-05T09:00:00-06:00' })
  actualizadoEn!: string;

  static fromEntity(
    rule: FeeRuleWithConfig,
    applicableUnits: number,
    timeZone: string,
  ): FeeRuleResponseDto {
    return {
      id: rule.id,
      estado: rule.status,
      concepto: rule.concept,
      tipoMonto: rule.amountType,
      monto: rule.amount === null ? null : rule.amount.toNumber(),
      montosPorTipo: rule.typeAmounts.map((t) => ({
        tipo: t.unitType,
        monto: t.amount.toNumber(),
      })),
      diaGeneracion: rule.generationDay,
      diaVencimiento: rule.dueDay,
      alcance: rule.scope,
      alcanceValor: rule.scopeValue,
      unidadIds: rule.units.map((u) => u.unitId),
      politicaInactivas: rule.inactivePolicy,
      unidadesAplicables: applicableUnits,
      creadoEn: toZonedIso(rule.createdAt, timeZone),
      actualizadoEn: toZonedIso(rule.updatedAt, timeZone),
    };
  }
}

export class FeeRuleStatusResponseDto {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ enum: FeeRuleStatus, example: FeeRuleStatus.PAUSADA })
  estado!: FeeRuleStatus;
}
