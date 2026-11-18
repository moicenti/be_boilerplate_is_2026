import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID, Length } from 'class-validator';
import { RequiredText } from '@Common/decorators';

export class CreatePackageDto {
  @ApiProperty({ format: 'uuid', description: 'Unidad destinataria.' })
  @IsUUID('4', { message: 'Selecciona una unidad destinataria válida.' })
  unitId!: string;

  @ApiProperty({ example: 'Carlos Mendoza', maxLength: 100 })
  @RequiredText('El nombre del destinatario', 100)
  recipientName!: string;

  @ApiProperty({ example: 'Estafeta', maxLength: 60 })
  @RequiredText('La empresa de mensajería', 60, 'obligatoria')
  carrier!: string;

  @ApiProperty({ example: 'EST-629483715', maxLength: 100 })
  @RequiredText('La referencia o guía', 100, 'obligatoria')
  trackingReference!: string;

  @ApiProperty({
    example: '1 caja mediana de cartón, cerrada.',
    maxLength: 200,
  })
  @RequiredText('La descripción del paquete', 200, 'obligatoria')
  description!: string;

  @ApiPropertyOptional({
    example: 'Sin daños visibles en el empaque.',
    maxLength: 300,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(0, 300, {
    message: 'Las observaciones no pueden superar los 300 caracteres.',
  })
  notes?: string;
}
