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

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId/recursos')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  // CA1: subir recurso con extracción Open Graph
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'CA1: Crear recurso en el grupo (extrae Open Graph si hay URL)' })
  crear(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: CreateResourceDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.crearRecurso(groupId, dto, userId);
  }

  // CA4: listar con filtro por tipo
  @Get()
  @ApiOperation({ summary: 'CA4: Listar recursos del grupo, filtrable por tipo_contenido' })
  @ApiQuery({ name: 'tipo', enum: TipoContenido, required: false })
  listar(
    @Param('groupId', ParseIntPipe) groupId: number,
    @GetClaim('sub') userId: number,
    @Query('tipo') tipo?: TipoContenido,
  ) {
    return this.resourcesService.listarRecursos(groupId, userId, tipo);
  }

  // Obtener recurso individual decorado
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un recurso decorado por ID' })
  obtener(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.obtenerRecurso(groupId, id, userId);
  }

  // CA3: editar — solo propietario o admin
  @Patch(':id')
  @ApiOperation({ summary: 'CA3: Editar recurso (solo propietario o admin del grupo)' })
  editar(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResourceDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.editarRecurso(groupId, id, dto, userId);
  }

  // CA3: eliminar — solo propietario o admin
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'CA3: Eliminar recurso (solo propietario o admin del grupo)' })
  eliminar(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.eliminarRecurso(groupId, id, userId);
  }

  // Agregar comentario
  @Post(':id/comentarios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar comentario a un recurso' })
  comentar(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCommentDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.agregarComentario(groupId, id, dto.contenido, userId);
  }

  // Valorar recurso
  @Post(':id/valoracion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valorar un recurso (1–5 estrellas, upsert)' })
  valorar(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateResourceDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.resourcesService.valorarRecurso(groupId, id, dto.valor, userId);
  }
}
