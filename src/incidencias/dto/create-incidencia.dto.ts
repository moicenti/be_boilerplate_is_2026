import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateIncidenciaDto {
  @IsString()
  @IsNotEmpty({ message: 'El asunto es obligatorio' })
  @MinLength(5, { message: 'El asunto debe tener al menos 5 caracteres' })
  @MaxLength(100, { message: 'El asunto no puede exceder los 100 caracteres' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  category: string;

  @IsString()
  @IsNotEmpty({ message: 'La ubicación es obligatoria' })
  location: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  @MaxLength(500, { message: 'La descripción no puede exceder los 500 caracteres' })
  description: string;
}