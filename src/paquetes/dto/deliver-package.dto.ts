import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { RequiredText } from '@Common/decorators';

export class DeliverPackageDto {
  @ApiProperty({
    example: '482913',
    description: 'Código de retiro de 6 dígitos.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Matches(/^\d{6}$/, {
    message: 'El código de retiro debe tener 6 dígitos.',
  })
  pickupCode!: string;

  @ApiProperty({ example: 'Ana Martínez', maxLength: 100 })
  @RequiredText('El nombre de quien recoge el paquete', 100)
  deliveredTo!: string;
}
