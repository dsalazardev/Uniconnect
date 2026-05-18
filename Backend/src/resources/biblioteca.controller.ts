import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetClaim } from '../auth/decorators/get-token-claim.decorator';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { RateResourceDto } from './dto/rate-resource.dto';
import { TipoContenido } from '@prisma/client';

@ApiTags('biblioteca')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('biblioteca')
export class BibliotecaController {
  constructor(private readonly resourcesService: ResourcesService) {}

  /** Programas accesibles por el usuario autenticado */
  @Get('programas')
  @ApiOperation({ summary: 'Listar programas a los que el usuario tiene acceso' })
  @ApiResponse({ status: 200, description: 'Lista de programas académicos del usuario' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  listarProgramas(@GetClaim('sub') userId: number) {
    return this.resourcesService.listarProgramasDelUsuario(userId);
  }

  /** CA4: Recursos de un programa, filtrable por tipo */
  @Get('programas/:id/recursos')
  @ApiOperation({ summary: 'Listar recursos del programa con filtro por tipo_contenido' })
  @ApiParam({ name: 'id', description: 'ID del programa académico', type: Number })
  @ApiQuery({ name: 'tipo', enum: TipoContenido, required: false, description: 'Filtrar por tipo de contenido' })
  @ApiResponse({ status: 200, description: 'Lista de recursos decorados del programa' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 403, description: 'El usuario no pertenece al programa solicitado' })
  listarRecursos(
    @Param('id', ParseIntPipe) programId: number,
    @GetClaim('sub') userId: number,
    @Query('tipo') tipo?: TipoContenido,
  ) {
    return this.resourcesService.listarPorPrograma(programId, userId, tipo);
  }

  /** CA1: Crear recurso con extracción Open Graph */
  @Post('programas/:id/recursos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear recurso con extracción automática de metadatos Open Graph' })
  @ApiParam({ name: 'id', description: 'ID del programa académico', type: Number })
  @ApiResponse({ status: 201, description: 'Recurso creado con metadatos OG extraídos', type: CreateResourceDto })
  @ApiResponse({ status: 400, description: 'Payload inválido — se requiere url_externa o titulo' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 403, description: 'El usuario no pertenece al programa' })
  crearRecurso(
    @Param('id', ParseIntPipe) programId: number,
    @Body() dto: CreateResourceDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.crearEnPrograma(programId, dto, userId);
  }

  /** Obtener recurso individual decorado */
  @Get('recursos/:id')
  @ApiOperation({ summary: 'Obtener recurso decorado por ID' })
  obtenerRecurso(
    @Param('id', ParseIntPipe) id: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.obtenerRecurso(id, userId);
  }

  /** CA3: Editar — solo propietario o admin del grupo */
  @Patch('recursos/:id')
  @ApiOperation({ summary: 'CA3: Editar recurso (solo propietario o admin del grupo asociado)' })
  editarRecurso(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResourceDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.editarRecurso(id, dto, userId);
  }

  /** CA3: Eliminar — solo propietario o admin del grupo */
  @Delete('recursos/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar recurso (solo propietario o admin del grupo asociado)' })
  @ApiParam({ name: 'id', description: 'ID del recurso', type: Number })
  @ApiResponse({ status: 200, description: 'Recurso eliminado correctamente' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 403, description: 'Sin permiso — no es propietario ni admin del grupo' })
  @ApiResponse({ status: 404, description: 'Recurso no encontrado' })
  eliminarRecurso(
    @Param('id', ParseIntPipe) id: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.eliminarRecurso(id, userId);
  }

  /** Agregar comentario (decorator RecursoConComentarios) */
  @Post('recursos/:id/comentarios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar comentario a un recurso' })
  @ApiParam({ name: 'id', description: 'ID del recurso', type: Number })
  @ApiResponse({ status: 201, description: 'Comentario agregado' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  comentar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCommentDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.agregarComentario(id, dto.contenido, userId);
  }

  /** Valorar (decorator RecursoConValoracion) */
  @Post('recursos/:id/valoracion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valorar un recurso (1–5 estrellas, upsert)' })
  @ApiParam({ name: 'id', description: 'ID del recurso', type: Number })
  @ApiResponse({ status: 200, description: 'Valoración registrada o actualizada' })
  @ApiResponse({ status: 400, description: 'Valor fuera del rango 1–5' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  valorar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateResourceDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.valorarRecurso(id, dto.valor, userId);
  }
}
