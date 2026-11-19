import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ActualizarPrivacidadDto {
  @ApiPropertyOptional({
    description: 'Si se envía y no coincide con el usuario autenticado, retorna 403 Forbidden (BE-21.2)',
  })
  @IsOptional()
  @IsUUID()
  residenteId?: string;

  @ApiProperty({ example: true, description: 'Interruptor global: Aparecer en el directorio vecinal' })
  @IsBoolean()
  visibleGlobal: boolean;

  @ApiProperty({ example: false, description: 'Interruptor individual: Mostrar teléfono' })
  @IsBoolean()
  mostrarTelefono: boolean;

  @ApiProperty({ example: true, description: 'Interruptor individual: Mostrar correo electrónico' })
  @IsBoolean()
  mostrarCorreo: boolean;

  @ApiPropertyOptional({ example: true, description: 'Interruptor de UI: Mostrar nombre completo' })
  @IsOptional()
  @IsBoolean()
  mostrarNombre?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Interruptor de UI: Mostrar unidad en directorio' })
  @IsOptional()
  @IsBoolean()
  mostrarUnidad?: boolean;
}