import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Length } from 'class-validator';
export function RequiredText(label, max, required = 'obligatorio') {
    return applyDecorators(Transform(({ value }) => typeof value === 'string' ? value.trim() : value), Length(1, max, {
        message: ({ value }) => typeof value === 'string' && value.length > max
            ? `${label} no puede superar los ${max} caracteres.`
            : `${label} es ${required}.`,
    }));
}
