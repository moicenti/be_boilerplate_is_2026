import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsNormalizedEmail } from '@Common/decorators';
import { Role } from '@PrismaClient';

/** Roles que el administrador puede crear. Los administradores salen del seed. */
export const CREATABLE_ROLES = [Role.RESIDENTE, Role.SEGURIDAD] as const;
export type CreatableRole = (typeof CREATABLE_ROLES)[number];

export class CreateUserDto {
  @ApiProperty({
    description: 'Email del usuario. Se normaliza a minúsculas y sin espacios.',
    example: 'nestor@example.com',
    format: 'email',
    maxLength: 254,
  })
  @IsNormalizedEmail()
  email!: string;

  @ApiProperty({
    description: 'Contraseña. Debe incluir al menos una minúscula, una mayúscula y un número.',
    example: 'Str0ngPass',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe incluir al menos una minúscula, una mayúscula y un número.',
  })
  password!: string;

  @ApiProperty({ enum: CREATABLE_ROLES, example: Role.RESIDENTE })
  @IsIn(CREATABLE_ROLES, { message: 'role debe ser RESIDENTE o SEGURIDAD.' })
  role!: CreatableRole;

  @ApiPropertyOptional({
    description: 'UUID de la unidad. Obligatorio para RESIDENTE; no se envía para SEGURIDAD.',
    format: 'uuid',
  })
  @ValidateIf((dto: CreateUserDto) => dto.role === Role.RESIDENTE || dto.unitId !== undefined)
  @IsUUID('4', { message: 'unitId debe ser un UUID válido.' })
  unitId?: string;
}