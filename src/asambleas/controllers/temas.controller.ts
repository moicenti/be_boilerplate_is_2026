import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
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
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '@Auth/decorators';
import { AsambleasService, VotosService } from '@Asambleas/services';
import {
  AssemblyResponseDto,
  CastVoteDto,
  VoteReceiptDto,
  VotingTopicDto,
} from '@Asambleas/dto';
import { Role, type User } from '@PrismaClient';

@ApiTags('asambleas')
@ApiBearerAuth()
@Controller('temas')
export class TemasController {
  constructor(
    private readonly asambleasService: AsambleasService,
    private readonly votosService: VotosService,
  ) {}

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

  @Post(':temaId/votos')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.RESIDENTE)
  @ApiOperation({
    summary: 'Registra el voto de la unidad del residente en un tema abierto',
    description:
      'Un solo voto por unidad y tema. El voto se guarda sin la unidad (secreto); no existen rutas para cambiarlo ni eliminarlo.',
  })
  @ApiCreatedResponse({ type: VoteReceiptDto })
  @ApiBadRequestResponse({ description: 'La opción no pertenece al tema.' })
  @ApiForbiddenResponse({ description: 'Solo residentes con unidad.' })
  @ApiNotFoundResponse({ description: 'La propuesta no existe.' })
  @ApiConflictResponse({ description: 'Tu unidad ya votó en este tema.' })
  @ApiUnprocessableEntityResponse({
    description: 'La votación no está abierta.',
  })
  async vote(
    @Param('temaId', ParseUUIDPipe) temaId: string,
    @Body() dto: CastVoteDto,
    @CurrentUser() user: User,
  ): Promise<VoteReceiptDto> {
    const receipt = await this.votosService.vote(temaId, dto.opcionId, user);
    return {
      ...receipt,
      message: 'Tu voto quedó registrado. Tu unidad ya votó en este tema.',
    };
  }
}
