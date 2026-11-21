import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncidenciaDto {
  @ApiProperty({
    example: 'Luminaria apagada en pasillo',
    minLength: 5,
    maxLength: 100,
    description: 'Asunto del reporte',
  })
  @IsString()
  @IsNotEmpty({ message: 'El asunto es obligatorio' })
  @MinLength(5, { message: 'El asunto debe tener al menos 5 caracteres' })
  @MaxLength(100, { message: 'El asunto no puede exceder los 100 caracteres' })
  title: string;

  @ApiProperty({
    example: 'Mantenimiento',
    description: 'Categoría del problema',
    enum: ['Mantenimiento', 'Plomería', 'Electricidad', 'Seguridad'],
  })
  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  category: string;

  @ApiProperty({
    example: 'Torre A · Piso 3 · Pasillo frente al elevador',
    description: 'Ubicación del problema',
  })
  @IsString()
  @IsNotEmpty({ message: 'La ubicación es obligatoria' })
  location: string;

  @ApiProperty({
    example: 'La luminaria frente al elevador del tercer piso no enciende desde anoche.',
    minLength: 20,
    maxLength: 500,
    description: 'Descripción detallada del problema',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  @MaxLength(500, { message: 'La descripción no puede exceder los 500 caracteres' })
  description: string;
}