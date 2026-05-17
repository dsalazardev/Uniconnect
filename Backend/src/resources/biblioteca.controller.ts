import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
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
  listarProgramas(@GetClaim('sub') userId: number) {
    return this.resourcesService.listarProgramasDelUsuario(userId);
  }

  /** CA4: Recursos de un programa, filtrable por tipo */
  @Get('programas/:id/recursos')
  @ApiOperation({ summary: 'CA4: Listar recursos del programa con filtro por tipo_contenido' })
  @ApiQuery({ name: 'tipo', enum: TipoContenido, required: false })
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
  @ApiOperation({ summary: 'CA1: Subir recurso con extracción Open Graph (segmentado por programa)' })
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
  @ApiOperation({ summary: 'CA3: Eliminar recurso (solo propietario o admin del grupo asociado)' })
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
  valorar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateResourceDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.valorarRecurso(id, dto.valor, userId);
  }
}
