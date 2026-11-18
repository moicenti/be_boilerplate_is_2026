import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tope de decimal(12,2). */
const MAX_AMOUNT = 9_999_999_999.99;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePaymentDto {
  @ApiProperty({ format: 'uuid', description: 'Unidad del residente autenticado' })
  @IsUUID('all', { message: 'unidadId debe ser un UUID' })
  unidadId!: string;

  @ApiProperty({ type: [Number], example: [301, 302], description: 'Cuotas a pagar' })
  @IsArray({ message: 'cuotaIds debe ser una lista' })
  @ArrayNotEmpty({ message: 'cuotaIds debe incluir al menos una cuota' })
  @ArrayMaxSize(100, { message: 'cuotaIds admite hasta 100 cuotas' })
  @ArrayUnique({ message: 'cuotaIds no puede repetir cuotas' })
  @IsInt({ each: true, message: 'cada cuotaId debe ser un número entero' })
  @Min(1, { each: true, message: 'cada cuotaId debe ser un entero positivo' })
  cuotaIds!: number[];

  @ApiProperty({
    example: 150.0,
    description: 'Se aplica por fecha de vencimiento ascendente; no puede superar lo adeudado.',
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'monto debe ser un número con hasta 2 decimales' })
  @IsPositive({ message: 'monto debe ser mayor a 0' })
  @Max(MAX_AMOUNT, { message: 'monto es demasiado grande' })
  monto!: number;

  @ApiPropertyOptional({
    example: 'TARJ-2026',
    maxLength: 64,
    description: 'Referencia del medio de pago. Única: repetirla responde 409 (evita doble cobro).',
  })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'referencia debe ser texto' })
  @IsNotEmpty({ message: 'referencia no puede estar vacía' })
  @MaxLength(64, { message: 'referencia no puede exceder los 64 caracteres' })
  referencia?: string;

  @ApiPropertyOptional({
    example: '2026',
    description:
      'Últimos 4 dígitos de la tarjeta de prueba. Si se envía, la pasarela simulada espera 5 s ' +
      'y rechaza la que termina en 2000 (402 PAGO_RECHAZADO). Nunca se envía el número completo.',
  })
  @IsOptional()
  @Matches(/^\d{4}$/, { message: 'tarjetaUltimos4 debe tener exactamente 4 dígitos' })
  tarjetaUltimos4?: string;
}
