import { ApiProperty } from '@nestjs/swagger';
import { FeeRuleAction } from '@PrismaClient';
import { toZonedIso } from '@CommonAreas/utils';
import type { FeeRuleChangeWithUser } from '../repositories/index.js';

export class FeeRuleChangeResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: FeeRuleAction })
  accion!: FeeRuleAction;

  @ApiProperty({ nullable: true, type: Object })
  valorAnterior!: unknown;

  @ApiProperty({ type: Object })
  valorNuevo!: unknown;

  @ApiProperty({ example: 'admin@example.com', nullable: true, type: String })
  usuario!: string | null;

  @ApiProperty({ example: '2026-11-05T09:00:00-06:00' })
  fecha!: string;

  static fromEntity(
    change: FeeRuleChangeWithUser,
    timeZone: string,
  ): FeeRuleChangeResponseDto {
    return {
      id: change.id,
      accion: change.action,
      valorAnterior: change.previousValue,
      valorNuevo: change.newValue,
      usuario: change.changedBy?.email ?? null,
      fecha: toZonedIso(change.changedAt, timeZone),
    };
  }
}
