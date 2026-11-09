import { ApiProperty } from '@nestjs/swagger';
import { CommonAreaBlockReason, type CommonAreaBlock } from '@PrismaClient';

export class BlockResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 2 })
  areaId!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  inicio!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  fin!: Date;

  @ApiProperty({ enum: CommonAreaBlockReason })
  motivo!: CommonAreaBlockReason;

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn!: Date;

  static fromEntity(block: CommonAreaBlock): BlockResponseDto {
    return {
      id: block.id,
      areaId: block.areaId,
      inicio: block.startsAt,
      fin: block.endsAt,
      motivo: block.reason,
      creadoEn: block.createdAt,
    };
  }
}
