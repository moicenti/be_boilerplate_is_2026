import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@Auth/decorators';
import { Role } from '@PrismaClient';
import { UsersService } from '@Users/services';
import { CreateUserDto, ListUsersQueryDto, UserResponseDto } from '@Users/dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Sin @Public(): RolesGuard deja pasar todo lo público sin mirar el rol.
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

  @Get()
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Lista residentes y personal de seguridad (solo administrador)' })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  @ApiForbiddenResponse({ description: 'Solo administradores.' })
  async list(@Query() query: ListUsersQueryDto): Promise<UserResponseDto[]> {
    const users = await this.usersService.list(query);
    return users.map((user) => UserResponseDto.fromEntity(user));
  }

  @Patch(':id/desactivar')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Desactiva un residente o guardia (solo administrador)',
    description:
      'Cierra sus sesiones, cancela sus reservas futuras y pre-autorizaciones vigentes y lo quita de su unidad.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiForbiddenResponse({ description: 'Solo administradores; no se desactivan administradores.' })
  @ApiNotFoundResponse({ description: 'El usuario no existe.' })
  @ApiConflictResponse({ description: 'La cuenta ya está desactivada.' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    const user = await this.usersService.deactivate(id);
    return UserResponseDto.fromEntity(user);
  }
}
