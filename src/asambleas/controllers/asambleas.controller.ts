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
  Query,
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
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '@Auth/decorators';
import { AsambleasService, VotosService } from '@Asambleas/services';
import {
  AssemblyPageResponseDto,
  AssemblyResponseDto,
  AssemblySummaryDto,
  AudienceResponseDto,
  CreateAssemblyDto,
  ListAssembliesQueryDto,
} from '@Asambleas/dto';
import { Role, type User } from '@PrismaClient';

@ApiTags('asambleas')
@ApiBearerAuth()
@Controller('asambleas')
export class AsambleasController {
  constructor(
    private readonly asambleasService: AsambleasService,
    private readonly votosService: VotosService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista las asambleas',
    description:
      'Administración ve también los borradores; el resto de los roles solo las publicadas.',
  })
  @ApiOkResponse({ type: AssemblyPageResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros inválidos.' })
  async list(
    @Query() query: ListAssembliesQueryDto,
    @CurrentUser() user: User,
  ): Promise<AssemblyPageResponseDto> {
    const page = await this.asambleasService.list(query, user);
    const now = this.asambleasService.now();
    const unitVotes = await this.votosService.unitVotesFor(
      user,
      page.items.flatMap((assembly) => assembly.topics.map((t) => t.id)),
    );
    return {
      ...page,
      items: page.items.map((assembly) =>
        AssemblySummaryDto.fromEntity(assembly, now, unitVotes),
      ),
    };
  }

  @Get('audiencia')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Cantidad de residentes que recibirán la convocatoria',
  })
  @ApiOkResponse({ type: AudienceResponseDto })
  @ApiForbiddenResponse({ description: 'Solo administración.' })
  async audience(): Promise<AudienceResponseDto> {
    return { residents: await this.asambleasService.audience() };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalle de una asamblea con su agenda, propuestas y estados',
  })
  @ApiOkResponse({ type: AssemblyResponseDto })
  @ApiNotFoundResponse({
    description: 'No existe o es un borrador y no eres administración.',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<AssemblyResponseDto> {
    const assembly = await this.asambleasService.findOne(id, user);
    const unitVotes = await this.votosService.unitVotesFor(
      user,
      assembly.topics.map((t) => t.id),
    );
    return AssemblyResponseDto.fromEntity(
      assembly,
      this.asambleasService.now(),
      unitVotes,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crea una convocatoria en borrador' })
  @ApiCreatedResponse({ type: AssemblyResponseDto })
  @ApiBadRequestResponse({
    description:
      'Datos incompletos, fecha pasada, menos de dos opciones o cierre no posterior a la apertura.',
  })
  @ApiForbiddenResponse({ description: 'Solo administración.' })
  async create(
    @Body() dto: CreateAssemblyDto,
    @CurrentUser() user: User,
  ): Promise<AssemblyResponseDto> {
    const assembly = await this.asambleasService.create(dto, user);
    return AssemblyResponseDto.fromEntity(
      assembly,
      this.asambleasService.now(),
    );
  }

  @Put(':id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Reemplaza el contenido de un borrador' })
  @ApiOkResponse({ type: AssemblyResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos.' })
  @ApiNotFoundResponse({ description: 'La asamblea no existe.' })
  @ApiConflictResponse({ description: 'La convocatoria ya fue publicada.' })
  @ApiForbiddenResponse({ description: 'Solo administración.' })
  async updateDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAssemblyDto,
  ): Promise<AssemblyResponseDto> {
    const assembly = await this.asambleasService.updateDraft(id, dto);
    return AssemblyResponseDto.fromEntity(
      assembly,
      this.asambleasService.now(),
    );
  }

  @Post(':id/publicacion')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary:
      'Publica la convocatoria y avisa a los residentes de todas las unidades',
  })
  @ApiOkResponse({ type: AssemblyResponseDto })
  @ApiBadRequestResponse({
    description: 'La reunión o alguna apertura ya pasó.',
  })
  @ApiNotFoundResponse({ description: 'La asamblea no existe.' })
  @ApiConflictResponse({ description: 'La convocatoria ya fue publicada.' })
  @ApiForbiddenResponse({ description: 'Solo administración.' })
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<AssemblyResponseDto> {
    const assembly = await this.asambleasService.publish(id, user);
    return AssemblyResponseDto.fromEntity(
      assembly,
      this.asambleasService.now(),
    );
  }
}
