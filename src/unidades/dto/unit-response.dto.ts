import { ApiProperty } from '@nestjs/swagger';
import { UnitType, type Unit } from '@PrismaClient';

export class UnitResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'A-304' })
  code!: string;

  @ApiProperty({ example: 'Torre A' })
  tower!: string;

  @ApiProperty({ example: 'Torre A, departamento 304' })
  description!: string;

  @ApiProperty({ enum: UnitType, example: UnitType.DEPARTAMENTO })
  type!: UnitType;

  @ApiProperty({ example: true })
  active!: boolean;

  static fromEntity(unit: Unit): UnitResponseDto {
    return {
      id: unit.id,
      code: unit.code,
      tower: unit.tower,
      description: unit.description,
      type: unit.type,
      active: unit.active,
    };
  }
}
