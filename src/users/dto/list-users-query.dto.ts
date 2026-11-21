import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { CREATABLE_ROLES, type CreatableRole } from './create-user.dto.js';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ enum: CREATABLE_ROLES })
  @IsOptional()
  @IsIn(CREATABLE_ROLES, { message: 'role debe ser RESIDENTE o SEGURIDAD.' })
  role?: CreatableRole;

  // En la query llega como texto; solo 'true'/'false' son válidos.
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'activo debe ser true o false.' })
  activo?: boolean;
}
