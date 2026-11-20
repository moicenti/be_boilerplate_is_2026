import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@Auth/decorators';
import { Role } from '@PrismaClient';
import { Throttle, hours } from '@nestjs/throttler';
import { Public } from '@Auth/decorators';
import { UsersService } from '@Users/services';
import { CreateUserDto, UserResponseDto } from '@Users/dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Registro. Crear un usuario es crear un recurso, así que es un POST a la
   * colección `/users` y responde 201 (el default de Nest para POST).
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: hours(1) } })
  @Post()
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crea un residente o un usuario de seguridad (solo administrador)' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({
    description: 'Datos inválidos: rol distinto de RESIDENTE/SEGURIDAD, residente sin unidad o seguridad con unidad.',
  })
  @ApiForbiddenResponse({ description: 'Solo administradores.' })
  @ApiNotFoundResponse({ description: 'La unidad indicada no existe.' })
  @ApiConflictResponse({ description: 'El email ya está registrado.' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(dto);
    return UserResponseDto.fromEntity(user);
  }
}
