import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenGraphService } from './services/open-graph.service';
import { RecursoBase } from './domain/decorator/recurso-base';
import { RecursoConEtiquetas } from './domain/decorator/recurso-con-etiquetas.decorator';
import { RecursoConValoracion } from './domain/decorator/recurso-con-valoracion.decorator';
import { RecursoConComentarios } from './domain/decorator/recurso-con-comentarios.decorator';
import { IRecurso } from './domain/decorator/recurso.interface';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { TipoContenido } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openGraphService: OpenGraphService,
  ) {}

  // ── CA1: Crear recurso con extracción Open Graph ────────────────────────
  async crearRecurso(groupId: number, dto: CreateResourceDto, userId: number) {
    await this.validateMembership(groupId, userId);

    let titulo = dto.titulo ?? '';
    let descripcion = dto.descripcion ?? null;
    let imagen_preview: string | null = null;

    if (dto.url_externa) {
      const og = await this.openGraphService.extraer(dto.url_externa);
      titulo = dto.titulo || og.titulo;
      descripcion = dto.descripcion || og.descripcion;
      imagen_preview = og.imagen_preview;
    }

    if (!titulo) throw new BadRequestException('El título es requerido si no se proporciona una URL');

    const resource = await this.prisma.resource.create({
      data: {
        id_group: groupId,
        created_by: userId,
        url_externa: dto.url_externa ?? null,
        titulo,
        descripcion,
        imagen_preview,
        tipo_contenido: dto.tipo_contenido,
        etiquetas: dto.etiquetas?.length
          ? { createMany: { data: dto.etiquetas.map((e) => ({ etiqueta: e })) } }
          : undefined,
      },
      include: this.resourceInclude(),
    });

    return this.buildResponse(resource);
  }

  // ── CA4: Listar con filtro por tipo ───────────────────────────────────
  async listarRecursos(groupId: number, userId: number, tipo?: TipoContenido) {
    await this.validateMembership(groupId, userId);

    const resources = await this.prisma.resource.findMany({
      where: { id_group: groupId, ...(tipo ? { tipo_contenido: tipo } : {}) },
      include: this.resourceInclude(),
      orderBy: { created_at: 'desc' },
    });

    return resources.map((r) => this.buildResponse(r));
  }

  // ── CA3: Editar — solo propietario o admin del grupo ──────────────────
  async editarRecurso(groupId: number, resourceId: number, dto: UpdateResourceDto, userId: number) {
    const resource = await this.findOrFail(resourceId, groupId);
    await this.assertOwnerOrAdmin(resource, groupId, userId);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.etiquetas !== undefined) {
        await tx.resource_tag.deleteMany({ where: { id_resource: resourceId } });
        if (dto.etiquetas.length > 0) {
          await tx.resource_tag.createMany({
            data: dto.etiquetas.map((e) => ({ id_resource: resourceId, etiqueta: e })),
          });
        }
      }
      return tx.resource.update({
        where: { id_resource: resourceId },
        data: {
          titulo: dto.titulo,
          descripcion: dto.descripcion,
          tipo_contenido: dto.tipo_contenido,
        },
        include: this.resourceInclude(),
      });
    });

    return this.buildResponse(updated);
  }

  // ── CA3: Eliminar — solo propietario o admin del grupo ────────────────
  async eliminarRecurso(groupId: number, resourceId: number, userId: number) {
    const resource = await this.findOrFail(resourceId, groupId);
    await this.assertOwnerOrAdmin(resource, groupId, userId);
    await this.prisma.resource.delete({ where: { id_resource: resourceId } });
    return { message: 'Recurso eliminado' };
  }

  // ── Agregar comentario ────────────────────────────────────────────────
  async agregarComentario(groupId: number, resourceId: number, contenido: string, userId: number) {
    await this.validateMembership(groupId, userId);
    await this.findOrFail(resourceId, groupId);
    return this.prisma.resource_comment.create({
      data: { id_resource: resourceId, id_user: userId, contenido },
      include: { user: { select: { id_user: true, full_name: true } } },
    });
  }

  // ── Valorar recurso ───────────────────────────────────────────────────
  async valorarRecurso(groupId: number, resourceId: number, valor: number, userId: number) {
    await this.validateMembership(groupId, userId);
    await this.findOrFail(resourceId, groupId);
    return this.prisma.resource_rating.upsert({
      where: { id_resource_id_user: { id_resource: resourceId, id_user: userId } },
      create: { id_resource: resourceId, id_user: userId, valor },
      update: { valor },
    });
  }

  // ── Obtener recurso decorado por ID ──────────────────────────────────
  async obtenerRecurso(groupId: number, resourceId: number, userId: number) {
    await this.validateMembership(groupId, userId);
    const resource = await this.findOrFail(resourceId, groupId);
    return this.buildResponse(resource);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async validateMembership(groupId: number, userId: number) {
    const m = await this.prisma.membership.findUnique({
      where: { id_user_id_group: { id_user: userId, id_group: groupId } },
    });
    if (!m) throw new ForbiddenException('No eres miembro de este grupo');
  }

  private async assertOwnerOrAdmin(
    resource: { created_by: number },
    groupId: number,
    userId: number,
  ) {
    if (resource.created_by === userId) return;
    const m = await this.prisma.membership.findUnique({
      where: { id_user_id_group: { id_user: userId, id_group: groupId } },
    });
    if (!m?.is_admin) throw new ForbiddenException('Solo el propietario o un administrador puede modificar este recurso');
  }

  private async findOrFail(resourceId: number, groupId: number) {
    const r = await this.prisma.resource.findFirst({
      where: { id_resource: resourceId, id_group: groupId },
      include: this.resourceInclude(),
    });
    if (!r) throw new NotFoundException('Recurso no encontrado en este grupo');
    return r;
  }

  /** CA2/CA5: Construye la cadena de decoradores y serializa getMetadata() en rendered_content */
  private buildResponse(resource: ResourceWithRelations) {
    const promedio = resource.valoraciones.length
      ? resource.valoraciones.reduce((s, v) => s + v.valor, 0) / resource.valoraciones.length
      : 0;

    let decorado: IRecurso = new RecursoBase(
      resource.titulo,
      resource.url_externa,
      resource.descripcion,
      resource.imagen_preview,
      resource.tipo_contenido,
      resource.created_by,
    );

    if (resource.etiquetas.length > 0) {
      decorado = new RecursoConEtiquetas(decorado, resource.etiquetas.map((t) => t.etiqueta));
    }

    if (resource.valoraciones.length > 0) {
      decorado = new RecursoConValoracion(decorado, promedio, resource.valoraciones.length);
    }

    if (resource.comentarios.length > 0) {
      decorado = new RecursoConComentarios(
        decorado,
        resource.comentarios.map((c) => ({
          id_comment: c.id_comment,
          contenido: c.contenido,
          usuario: c.user.full_name,
          fecha: c.created_at.toISOString(),
        })),
      );
    }

    return {
      id_resource: resource.id_resource,
      id_group: resource.id_group,
      created_by: resource.created_by,
      creator: resource.creator,
      url_externa: resource.url_externa,
      titulo: resource.titulo,
      descripcion: resource.descripcion,
      imagen_preview: resource.imagen_preview,
      tipo_contenido: resource.tipo_contenido,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      decoradores: decorado.getMetadata(),
    };
  }

  private resourceInclude() {
    return {
      creator: { select: { id_user: true, full_name: true, picture: true } },
      etiquetas: true,
      valoraciones: true,
      comentarios: {
        include: { user: { select: { id_user: true, full_name: true } } },
        orderBy: { created_at: 'desc' as const },
        take: 20,
      },
    } as const;
  }
}

type ResourceWithRelations = Awaited<ReturnType<ResourcesService['findOrFail']>>;
