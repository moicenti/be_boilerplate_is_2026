import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolverIncidenciaDto {
  @ApiProperty({ minLength: 10, maxLength: 200 })
  @IsString()
  @IsNotEmpty({ message: 'El comentario de resolución es obligatorio' })
  @MinLength(10, { message: 'El comentario debe tener al menos 10 caracteres' })
  @MaxLength(200, { message: 'El comentario no puede exceder 200 caracteres' })
  resolutionComment: string;
}