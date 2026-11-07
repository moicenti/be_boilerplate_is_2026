import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { CategoriaComunicado, PrioridadComunicado, AudienciaTipo } from '../../generated/prisma/index.js';

export class CrearComunicadoDto {
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @Length(10, 120, { message: 'El título debe contener entre 10 y 120 caracteres' })
  titulo!: string;

  @IsString({ message: 'El cuerpo debe ser un texto' })
  @IsNotEmpty({ message: 'El cuerpo del comunicado es obligatorio' })
  @Length(30, 2000, { message: 'El cuerpo debe contener entre 30 y 2000 caracteres' })
  cuerpo!: string;

  @IsEnum(CategoriaComunicado, {
    message: 'La categoría debe ser MANTENIMIENTO, SEGURIDAD o ADMINISTRATIVO',
  })
  categoria!: CategoriaComunicado;

  @IsEnum(PrioridadComunicado, {
    message: 'La prioridad debe ser INFORMATIVO, IMPORTANTE o URGENTE',
  })
  prioridad!: PrioridadComunicado;

  @IsEnum(AudienciaTipo, {
    message: 'La audiencia debe ser TODO_EL_CONDOMINIO, POR_TORRE o POR_SECCION',
  })
  audienciaTipo!: AudienciaTipo;

  @IsOptional()
  @IsString()
  audienciaTarget?: string;
}