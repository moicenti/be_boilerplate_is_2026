import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@Auth/decorators';
import { AsambleasService } from '@Asambleas/services';
import { AssemblyResponseDto, VotingTopicDto } from '@Asambleas/dto';
import { Role } from '@PrismaClient';

@ApiTags('asambleas')
@ApiBearerAuth()
@Controller('temas')
export class TemasController {
  constructor(private readonly asambleasService: AsambleasService) {}

  @Put(':temaId')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Modifica una propuesta mientras su votación no haya abierto',
  })
  @ApiOkResponse({ type: AssemblyResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos.' })
  @ApiNotFoundResponse({ description: 'La propuesta no existe.' })
  @ApiConflictResponse({ description: 'La votación ya abrió.' })
  @ApiForbiddenResponse({ description: 'Solo administración.' })
  async update(
    @Param('temaId', ParseUUIDPipe) temaId: string,
    @Body() dto: VotingTopicDto,
  ): Promise<AssemblyResponseDto> {
    const assembly = await this.asambleasService.updateTopic(temaId, dto);
    return AssemblyResponseDto.fromEntity(
      assembly,
      this.asambleasService.now(),
    );
  }
}
