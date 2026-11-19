import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarPrivacidadDto {
  @ApiPropertyOptional({ example: 'Ana' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Martínez' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  apellido?: string;

  @ApiPropertyOptional({ example: '+503 7123-4567' })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  telefono?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Activa o desactiva la aparición global en el directorio',
  })
  @IsOptional()
  @IsBoolean()
  visibleEnDirectorio?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Muestra u oculta el número de teléfono en el directorio',
  })
  @IsOptional()
  @IsBoolean()
  mostrarTelefono?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Muestra u oculta el correo electrónico en el directorio',
  })
  @IsOptional()
  @IsBoolean()
  mostrarCorreo?: boolean;
}