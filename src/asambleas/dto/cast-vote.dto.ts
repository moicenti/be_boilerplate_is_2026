import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CastVoteDto {
  @ApiProperty({ format: 'uuid', description: 'Opción elegida del tema.' })
  @IsUUID('4', { message: 'Selecciona una opción válida.' })
  opcionId!: string;
}

export class VoteReceiptDto {
  @ApiProperty({ format: 'uuid' })
  topicId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  votedAt!: Date;

  @ApiProperty({
    example: 'Tu voto quedó registrado. Tu unidad ya votó en este tema.',
  })
  message!: string;
}
