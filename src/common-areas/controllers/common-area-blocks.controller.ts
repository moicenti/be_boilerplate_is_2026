import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Role, type User } from '@PrismaClient';
import { CurrentUser, Roles } from '@Auth/decorators';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { CommonAreaBlocksService } from '../services/index.js';
import { BlockResponseDto, CreateBlockDto } from '../dto/index.js';

const parseId = (label: string) =>
  new ParseIntPipe({
    exceptionFactory: () =>
      new ApiException(
        HttpStatus.BAD_REQUEST,
        'SOLICITUD_INVALIDA',
        `El id ${label} debe ser un número entero.`,
      ),
  });

@ApiTags('areas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' })
@ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' })
@ApiNotFoundResponse({ description: 'AREA_INEXISTENTE / BLOQUEO_INEXISTENTE' })
@UseFilters(ApiExceptionFilter)
@Roles(Role.ADMINISTRADOR)
@Controller('areas/:areaId/bloqueos')
export class CommonAreaBlocksController {
  constructor(private readonly blocksService: CommonAreaBlocksService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los bloqueos de un área' })
  @ApiOkResponse({ type: [BlockResponseDto] })
  async findAll(
    @Param('areaId', parseId('del área')) areaId: number,
  ): Promise<BlockResponseDto[]> {
    const blocks = await this.blocksService.findAll(areaId);
    return blocks.map((block) => BlockResponseDto.fromEntity(block));
  }

  @Post()
  @ApiOperation({ summary: 'Bloquea un horario de uso permitido del área' })
  @ApiCreatedResponse({ type: BlockResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  @ApiConflictResponse({ description: 'BLOQUEO_SUPERPUESTO / BLOQUEO_CON_RESERVAS' })
  @ApiUnprocessableEntityResponse({ description: 'DATOS_INVALIDOS / BLOQUEO_FUERA_DE_HORARIO' })
  async create(
    @Param('areaId', parseId('del área')) areaId: number,
    @Body() dto: CreateBlockDto,
    @CurrentUser() user: User,
  ): Promise<BlockResponseDto> {
    const block = await this.blocksService.create(areaId, dto, user);
    return BlockResponseDto.fromEntity(block);
  }

  @Delete(':blockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un bloqueo que aún no terminó' })
  @ApiNoContentResponse({ description: 'Bloqueo eliminado' })
  @ApiConflictResponse({ description: 'TRANSICION_INVALIDA: el bloqueo ya terminó' })
  async remove(
    @Param('areaId', parseId('del área')) areaId: number,
    @Param('blockId', parseId('del bloqueo')) blockId: number,
  ): Promise<void> {
    await this.blocksService.remove(areaId, blockId);
  }
}
