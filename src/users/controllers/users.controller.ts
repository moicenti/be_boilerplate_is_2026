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
import { UsersService } from '@Users/services';
import { CreateUserDto, UserResponseDto } from '@Users/dto';

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
}
