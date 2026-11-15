import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { IsNormalizedEmail } from '@Common/decorators';

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

  @ApiProperty({
    description: 'UUID de la unidad a la que pertenece el usuario.',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'unitId debe ser un UUID válido.' })
  unitId!: string;
}