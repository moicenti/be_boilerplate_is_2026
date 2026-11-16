import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '@Auth/decorators';
import { PreautorizacionService } from '@Visitas/services/';
import { CreatePreautorizacionDto } from '@Visitas/dto/';
import type { User } from '@PrismaClient';

@Controller('preautorizaciones')
export class PreautorizacionController {
  constructor(private readonly service: PreautorizacionService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreatePreautorizacionDto,
  ) {
    return this.service.create(user, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findOne(id, user.id);
  }
}