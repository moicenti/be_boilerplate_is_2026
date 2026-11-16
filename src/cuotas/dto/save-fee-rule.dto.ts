import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  FeeAmountType,
  FeeRuleScope,
  FeeRuleStatus,
  InactiveUnitPolicy,
  UnitType,
} from '@PrismaClient';

const MAX_AMOUNT = 9_999_999_999.99;

// Recorta y colapsa espacios: "  Cuota   de mantenimiento " → "Cuota de mantenimiento".
const normalizeText = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class TypeAmountDto {
  @ApiProperty({ enum: UnitType, example: UnitType.DEPARTAMENTO })
  @IsEnum(UnitType, { message: 'tipo debe ser DEPARTAMENTO, CASA o LOCAL' })
  tipo!: UnitType;

  @ApiProperty({ example: 100.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'monto debe ser un número con hasta 2 decimales' },
  )
  @IsPositive({ message: 'monto debe ser mayor a 0' })
  @Max(MAX_AMOUNT, { message: 'monto es demasiado grande' })
  monto!: number;
}

export class SaveFeeRuleDto {
  @ApiProperty({ example: 'Mantenimiento', maxLength: 100 })
  @Transform(normalizeText)
  @IsString({ message: 'concepto debe ser texto' })
  @IsNotEmpty({ message: 'concepto es obligatorio' })
  @MaxLength(100, { message: 'concepto no puede exceder los 100 caracteres' })
  concepto!: string;

  @ApiProperty({ enum: FeeAmountType, example: FeeAmountType.FIJO })
  @IsEnum(FeeAmountType, {
    message: 'tipoMonto debe ser FIJO o POR_TIPO_UNIDAD',
  })
  tipoMonto!: FeeAmountType;

  @ApiPropertyOptional({
    example: 100.0,
    nullable: true,
    description:
      'Monto por unidad (tipoMonto FIJO). Sin él la regla no se puede activar.',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'monto debe ser un número con hasta 2 decimales' },
  )
  @IsPositive({ message: 'monto debe ser mayor a 0' })
  @Max(MAX_AMOUNT, { message: 'monto es demasiado grande' })
  monto?: number | null;

  @ApiPropertyOptional({
    type: [TypeAmountDto],
    description: 'Monto de cada tipo de unidad (tipoMonto POR_TIPO_UNIDAD).',
  })
  @IsOptional()
  @IsArray({ message: 'montosPorTipo debe ser una lista' })
  @ArrayMaxSize(Object.keys(UnitType).length, {
    message: 'montosPorTipo tiene tipos de más',
  })
  @ValidateNested({ each: true })
  @Type(() => TypeAmountDto)
  montosPorTipo?: TypeAmountDto[];

  @ApiProperty({ example: 1, minimum: 1, maximum: 28 })
  @IsInt({ message: 'diaGeneracion debe ser un número entero' })
  @Min(1, { message: 'diaGeneracion debe estar entre 1 y 28' })
  @Max(28, { message: 'diaGeneracion debe estar entre 1 y 28' })
  diaGeneracion!: number;

  @ApiProperty({
    example: 10,
    minimum: 1,
    maximum: 28,
    description: 'Mayor o igual a diaGeneracion',
  })
  @IsInt({ message: 'diaVencimiento debe ser un número entero' })
  @Min(1, { message: 'diaVencimiento debe estar entre 1 y 28' })
  @Max(28, { message: 'diaVencimiento debe estar entre 1 y 28' })
  diaVencimiento!: number;

  @ApiProperty({ enum: FeeRuleScope, example: FeeRuleScope.TODAS })
  @IsEnum(FeeRuleScope, {
    message: 'alcance debe ser TODAS, TIPO, TORRE o SELECCION',
  })
  alcance!: FeeRuleScope;

  @ApiPropertyOptional({
    example: 'Torre A',
    nullable: true,
    description:
      'Obligatorio con alcance TORRE (nombre de la torre) o TIPO (tipo de unidad).',
  })
  @IsOptional()
  @Transform(normalizeText)
  @IsString({ message: 'alcanceValor debe ser texto' })
  @IsNotEmpty({ message: 'alcanceValor no puede estar vacío' })
  @MaxLength(50, { message: 'alcanceValor no puede exceder los 50 caracteres' })
  alcanceValor?: string | null;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    example: [],
    description: 'Unidades de la regla; solo con alcance SELECCION.',
  })
  @IsOptional()
  @IsArray({ message: 'unidadIds debe ser una lista' })
  @ArrayMaxSize(5000, { message: 'unidadIds tiene demasiados elementos' })
  @IsUUID('all', {
    each: true,
    message: 'cada elemento de unidadIds debe ser un UUID',
  })
  unidadIds?: string[];

  @ApiPropertyOptional({
    enum: InactiveUnitPolicy,
    default: InactiveUnitPolicy.OMITIR,
  })
  @IsOptional()
  @IsEnum(InactiveUnitPolicy, {
    message: 'politicaInactivas debe ser GENERAR, OMITIR o REVISAR',
  })
  politicaInactivas?: InactiveUnitPolicy;
}

export class CreateFeeRuleDto extends SaveFeeRuleDto {
  @ApiPropertyOptional({
    enum: FeeRuleStatus,
    default: FeeRuleStatus.ACTIVA,
    description:
      'Estado inicial. INACTIVA permite guardar una regla incompleta como borrador.',
  })
  @IsOptional()
  @IsIn(Object.values(FeeRuleStatus), {
    message: 'estado debe ser ACTIVA, PAUSADA o INACTIVA',
  })
  estado?: FeeRuleStatus;
}
