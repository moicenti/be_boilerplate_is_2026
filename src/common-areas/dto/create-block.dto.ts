import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsISO8601, Matches } from 'class-validator';
import { CommonAreaBlockReason } from '@PrismaClient';

const ISO_WITH_OFFSET = /(Z|[+-]\d{2}:\d{2})$/;

export class CreateBlockDto {
  @ApiProperty({ example: '2026-11-14T10:00:00-06:00' })
  @IsISO8601({ strict: true }, { message: 'inicio debe ser una fecha ISO 8601' })
  @Matches(ISO_WITH_OFFSET, { message: 'inicio debe indicar la zona horaria (Z o ±HH:mm)' })
  inicio!: string;

  @ApiProperty({ example: '2026-11-14T14:00:00-06:00' })
  @IsISO8601({ strict: true }, { message: 'fin debe ser una fecha ISO 8601' })
  @Matches(ISO_WITH_OFFSET, { message: 'fin debe indicar la zona horaria (Z o ±HH:mm)' })
  fin!: string;

  @ApiProperty({ enum: CommonAreaBlockReason, example: CommonAreaBlockReason.MANTENIMIENTO })
  @IsEnum(CommonAreaBlockReason, {
    message: 'motivo debe ser MANTENIMIENTO, RENOVACION u OTRO',
  })
  motivo!: CommonAreaBlockReason;
}
