import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PerfilBase } from './domain/decorator/perfil-base';
import { PerfilConEstadisticas } from './domain/decorator/perfil-con-estadisticas.decorator';
import { PerfilConInsignias } from './domain/decorator/perfil-con-insignias.decorator';
import { calcularInsignias } from './domain/decorator/insignias/insignias.factory';
import { IPerfilEstudiante, PerfilRendered } from './domain/decorator/interfaces/perfil-estudiante.interface';

@Injectable()
export class PerfilService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CA #5: GET /perfil/:id — retorna únicamente el perfil base.
   * Sin costo computacional adicional: no consulta grupos ni mensajes.
   */
  async getPerfil(userId: number): Promise<PerfilRendered> {
    const user = await this.prisma.user.findUnique({
      where: { id_user: userId },
      select: {
        id_user: true,
        full_name: true,
        current_semester: true,
        program: { select: { name: true } },
        enrollments: {
          where: { status: 'active' },
          select: { course: { select: { id_course: true, name: true } } },
        },
      },
    });

    if (!user) throw new NotFoundException('Estudiante no encontrado');

    const perfil: IPerfilEstudiante = new PerfilBase(
      user.id_user,
      user.full_name ?? 'Sin nombre',
      user.program?.name ?? null,
      user.current_semester ?? null,
      user.enrollments
        .filter((e) => e.course !== null)
        .map((e) => ({ id_course: e.course!.id_course, nombre: e.course!.name ?? '' })),
    );

    return perfil.render();
  }

  /**
   * CA #4: GET /perfil/:id?vista=completa — retorna el perfil con todos los decoradores:
   * PerfilBase → PerfilConEstadisticas → PerfilConInsignias.
   */
  async getPerfilCompleto(userId: number): Promise<PerfilRendered> {
    const [user, gruposCreados, gruposParticipa, mensajesEnviados] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id_user: userId },
          select: {
            id_user: true,
            full_name: true,
            current_semester: true,
            program: { select: { name: true } },
            enrollments: {
              where: { status: 'active' },
              select: { course: { select: { id_course: true, name: true } } },
            },
          },
        }),
        this.prisma.group.count({
          where: { owner_id: userId, is_direct_message: false },
        }),
        this.prisma.membership.count({
          where: { id_user: userId, group: { is_direct_message: false } },
        }),
        this.prisma.message.count({
          where: { membership: { id_user: userId } },
        }),
      ]);

    if (!user) throw new NotFoundException('Estudiante no encontrado');

    const estadisticas = { gruposCreados, gruposParticipa, mensajesEnviados };
    const insignias = calcularInsignias(estadisticas, user.current_semester ?? null);

    let perfil: IPerfilEstudiante = new PerfilBase(
      user.id_user,
      user.full_name ?? 'Sin nombre',
      user.program?.name ?? null,
      user.current_semester ?? null,
      user.enrollments
        .filter((e) => e.course !== null)
        .map((e) => ({ id_course: e.course!.id_course, nombre: e.course!.name ?? '' })),
    );

    perfil = new PerfilConEstadisticas(perfil, estadisticas);
    perfil = new PerfilConInsignias(perfil, insignias);

    return perfil.render();
  }
}
