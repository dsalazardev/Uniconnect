import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@ApiTags('memberships')
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear membresía — agregar usuario a grupo' })
  @ApiResponse({ status: 201, description: 'Membresía creada' })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  create(@Body() createMembershipDto: CreateMembershipDto) {
    return this.membershipsService.create(createMembershipDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las membresías' })
  @ApiResponse({ status: 200, description: 'Lista de membresías' })
  findAll() {
    return this.membershipsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener membresía por ID' })
  @ApiParam({ name: 'id', description: 'ID de la membresía', type: Number })
  @ApiResponse({ status: 200, description: 'Membresía encontrada' })
  @ApiResponse({ status: 404, description: 'Membresía no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.membershipsService.findOne(id);
  }

  @Get('user/:id_user')
  @ApiOperation({ summary: 'Obtener todas las membresías de un usuario' })
  @ApiParam({ name: 'id_user', description: 'ID del usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de membresías del usuario' })
  findByUser(@Param('id_user', ParseIntPipe) id_user: number) {
    return this.membershipsService.findByUser(id_user);
  }

  @Get('group/:id_group')
  @ApiOperation({ summary: 'Obtener todas las membresías de un grupo' })
  @ApiParam({ name: 'id_group', description: 'ID del grupo', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de membresías del grupo' })
  findByGroup(@Param('id_group', ParseIntPipe) id_group: number) {
    return this.membershipsService.findByGroup(id_group);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar membresía por ID' })
  @ApiParam({ name: 'id', description: 'ID de la membresía', type: Number })
  @ApiResponse({ status: 200, description: 'Membresía actualizada' })
  @ApiResponse({ status: 404, description: 'Membresía no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return this.membershipsService.update(id, updateMembershipDto);
  }

  @Patch(':id/toggle-admin')
  @ApiOperation({ summary: 'Promover o degradar usuario a administrador del grupo' })
  @ApiParam({ name: 'id', description: 'ID de la membresía', type: Number })
  @ApiResponse({ status: 200, description: 'Rol de admin actualizado' })
  @ApiResponse({ status: 404, description: 'Membresía no encontrada' })
  toggleAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { is_admin: boolean },
  ) {
    return this.membershipsService.toggleAdmin(id, body.is_admin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar membresía — remover usuario del grupo' })
  @ApiParam({ name: 'id', description: 'ID de la membresía', type: Number })
  @ApiResponse({ status: 200, description: 'Membresía eliminada' })
  @ApiResponse({ status: 404, description: 'Membresía no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.membershipsService.remove(id);
  }
}
