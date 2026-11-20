import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolverIncidenciaDto {
  @ApiProperty({
    example: 'Se reparó la luminaria y se verificó el circuito completo.',
    minLength: 10,
    maxLength: 200,
    description: 'Comentario de resolución',
  })
  @IsString()
  @IsNotEmpty({ message: 'El comentario de resolución es obligatorio' })
  @MinLength(10, { message: 'El comentario debe tener al menos 10 caracteres' })
  @MaxLength(200, { message: 'El comentario no puede exceder 200 caracteres' })
  resolutionComment: string;
}