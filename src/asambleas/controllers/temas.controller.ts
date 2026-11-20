import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  StreamableFile,
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
  ApiProduces,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '@Auth/decorators';
import {
  AsambleasService,
  AuditDocumentRenderer,
  ResultadosService,
  VotosService,
} from '@Asambleas/services';
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
    private readonly resultadosService: ResultadosService,
    private readonly auditRenderer: AuditDocumentRenderer,
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

  @Get(':temaId/resultados')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Resultados de la votación de un tema',
    description:
      'Con la votación abierta solo devuelve cuántas unidades han votado. Cerrada: votos y porcentaje por opción, unidades habilitadas (registradas al abrir), participación y ganador o empate.',
  })
  @ApiOkResponse({ description: 'Resultados del tema.' })
  @ApiNotFoundResponse({ description: 'La propuesta no existe.' })
  @ApiForbiddenResponse({ description: 'Solo administración.' })
  results(@Param('temaId', ParseUUIDPipe) temaId: string) {
    return this.resultadosService.results(temaId);
  }

  @Get(':temaId/auditoria')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Auditoría de un tema cerrado',
    description:
      'Unidades que votaron con la fecha y hora de su voto (sin la opción), apertura, cierre y eventos del proceso.',
  })
  @ApiOkResponse({ description: 'Auditoría del tema.' })
  @ApiNotFoundResponse({ description: 'La propuesta no existe.' })
  @ApiConflictResponse({ description: 'La votación no ha cerrado.' })
  @ApiForbiddenResponse({ description: 'Solo administración.' })
  audit(@Param('temaId', ParseUUIDPipe) temaId: string) {
    return this.resultadosService.audit(temaId);
  }

  @Get(':temaId/auditoria/pdf')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary:
      'Exporta en PDF los resultados y la participación de un tema cerrado',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'Documento PDF.' })
  @ApiNotFoundResponse({ description: 'La propuesta no existe.' })
  @ApiConflictResponse({ description: 'La votación no ha cerrado.' })
  @ApiForbiddenResponse({ description: 'Solo administración.' })
  async auditPdf(
    @Param('temaId', ParseUUIDPipe) temaId: string,
  ): Promise<StreamableFile> {
    const audit = await this.resultadosService.audit(temaId);
    const pdf = await this.auditRenderer.render(audit, (date) =>
      this.resultadosService.format(date),
    );
    const filename = `auditoria-${audit.assembly.folio}-propuesta-${audit.topic.position + 1}.pdf`;
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
