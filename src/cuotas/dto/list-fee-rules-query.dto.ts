import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FeeRuleStatus } from '@PrismaClient';

export class ListFeeRulesQueryDto {
  @ApiPropertyOptional({ enum: FeeRuleStatus })
  @IsOptional()
  @IsEnum(FeeRuleStatus, {
    message: 'estado debe ser ACTIVA, PAUSADA o INACTIVA',
  })
  estado?: FeeRuleStatus;
}
