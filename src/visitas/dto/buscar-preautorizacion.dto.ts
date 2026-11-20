import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuscarPreautorizacionDto {
  @ApiProperty({
    example: 'AB3K9XZ2',
    description: 'Código, documento o nombre del visitante',
  })
  @IsString()
  @IsNotEmpty()
  query: string;
}