import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Length, type ValidationArguments } from 'class-validator';

export function RequiredText(
  label: string,
  max: number,
  required = 'obligatorio',
) {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    Length(1, max, {
      message: ({ value }: ValidationArguments) =>
        typeof value === 'string' && value.length > max
          ? `${label} no puede superar los ${max} caracteres.`
          : `${label} es ${required}.`,
    }),
  );
}
