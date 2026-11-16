import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { FeeRuleStatus } from '@PrismaClient';

export class ChangeFeeRuleStatusDto {
  @ApiProperty({ enum: FeeRuleStatus, example: FeeRuleStatus.PAUSADA })
  @IsEnum(FeeRuleStatus, {
    message: 'estado debe ser ACTIVA, PAUSADA o INACTIVA',
  })
  estado!: FeeRuleStatus;
}
