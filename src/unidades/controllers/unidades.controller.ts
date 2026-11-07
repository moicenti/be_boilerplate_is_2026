import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@Auth/decorators';
import { UnidadesService } from '@Unidades/services';
import { UnitResponseDto } from '@Unidades/dto';
import { Role } from '@PrismaClient';

@ApiTags('unidades')
@ApiBearerAuth()
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  @Get()
  @Roles(Role.SEGURIDAD, Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Lista las unidades del condominio' })
  @ApiOkResponse({ type: UnitResponseDto, isArray: true })
  @ApiForbiddenResponse({ description: 'El rol no tiene acceso.' })
  async findAll(): Promise<UnitResponseDto[]> {
    const units = await this.unidadesService.findAll();
    return units.map((unit) => UnitResponseDto.fromEntity(unit));
  }
}
