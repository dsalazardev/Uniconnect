import { buildTestApp, request, TestApp } from './helpers/test-app.builder';
import { signTestJwt } from './helpers/jwt-test.helper';
import {
  ProgramaSummaryArraySchema,
  ResourceArraySchema,
  ResourceSchema,
  CommentResponseSchema,
  RatingResponseSchema,
  DeleteResourceResponseSchema,
} from '@uniconnect/shared';

describe('Biblioteca (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => { app = await buildTestApp(); });
  afterAll(async () => { await app.close(); });

  const authHeader = () => `Bearer ${signTestJwt(1)}`;

  const mockUser = {
    id_user: 1, id_program: 1, full_name: 'Test User', email: 'test@test.com',
    cell_phone: null, picture: null, current_semester: 3,
    program: { id_program: 1, name: 'Ingeniería' },
    enrollments: [],
  };

  const mockCreator = { id_user: 1, full_name: 'Test User', picture: null };

  const mockResource = {
    id_resource: 1, id_program: 1, id_group: null, created_by: 1,
    creator: mockCreator,
    url_externa: 'https://example.com/doc', titulo: 'Test Resource',
    descripcion: 'A test resource', imagen_preview: null,
    tipo_contenido: 'ENLACE',
    created_at: new Date(), updated_at: new Date(),
    etiquetas: [],
    valoraciones: [],
    comentarios: [],
  };

  const mockProgramAccess = {
    id_user: 1, id_program: 1,
    enrollments: [],
  };

  describe('GET /biblioteca/programas', () => {
    it('should return programs matching ProgramaSummary contract', async () => {
      app.prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app.httpServer)
        .get('/biblioteca/programas')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = ProgramaSummaryArraySchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
    });
  });

  describe('GET /biblioteca/programas/:id/recursos', () => {
    it('should return resources matching Resource contract', async () => {
      app.prisma.user.findUnique.mockResolvedValue(mockProgramAccess);
      app.prisma.resource.findMany.mockResolvedValue([mockResource]);

      const res = await request(app.httpServer)
        .get('/biblioteca/programas/1/recursos')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = ResourceArraySchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveLength(1);
    });

    it('should filter by tipo query parameter', async () => {
      app.prisma.user.findUnique.mockResolvedValue(mockProgramAccess);
      app.prisma.resource.findMany.mockResolvedValue([]);

      const res = await request(app.httpServer)
        .get('/biblioteca/programas/1/recursos?tipo=VIDEO')
        .set('Authorization', authHeader())
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('should return 403 for unauthorized program access', async () => {
      app.prisma.user.findUnique.mockResolvedValue({
        ...mockProgramAccess, id_program: 5, enrollments: [],
      });

      await request(app.httpServer)
        .get('/biblioteca/programas/2/recursos')
        .set('Authorization', authHeader())
        .expect(403);
    });
  });

  describe('POST /biblioteca/programas/:id/recursos', () => {
    it('should create a resource and return it matching Resource contract', async () => {
      app.prisma.user.findUnique.mockResolvedValue(mockProgramAccess);
      app.prisma.resource.create.mockResolvedValue(mockResource);

      const res = await request(app.httpServer)
        .post('/biblioteca/programas/1/recursos')
        .set('Authorization', authHeader())
        .send({
          url_externa: 'https://example.com/doc',
          titulo: 'Test Resource',
          tipo_contenido: 'ENLACE',
        })
        .expect(201);

      const parsed = ResourceSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
    });

    it('should reject request without auth with 401', async () => {
      await request(app.httpServer)
        .post('/biblioteca/programas/1/recursos')
        .send({ titulo: 'Test', tipo_contenido: 'ENLACE' })
        .expect(401);
    });
  });

  describe('GET /biblioteca/recursos/:id', () => {
    it('should return single resource matching Resource contract', async () => {
      app.prisma.resource.findUnique.mockResolvedValue(mockResource);
      app.prisma.user.findUnique.mockResolvedValue(mockProgramAccess);

      const res = await request(app.httpServer)
        .get('/biblioteca/recursos/1')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = ResourceSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
    });

    it('should return 404 for non-existent resource', async () => {
      app.prisma.resource.findUnique.mockResolvedValue(null);

      await request(app.httpServer)
        .get('/biblioteca/recursos/999')
        .set('Authorization', authHeader())
        .expect(404);
    });
  });

  describe('PATCH /biblioteca/recursos/:id', () => {
    it('should update resource and return matching contract', async () => {
      app.prisma.resource.findUnique.mockResolvedValue(mockResource);
      app.prisma.resource.update.mockResolvedValue(mockResource);
      app.prisma.resource_tag.deleteMany.mockResolvedValue({ count: 0 });
      app.prisma.$transaction.mockImplementation(
        (cb: any) => typeof cb === 'function' ? cb(app.prisma) : Promise.all(cb)
      );

      const res = await request(app.httpServer)
        .patch('/biblioteca/recursos/1')
        .set('Authorization', authHeader())
        .send({ titulo: 'Updated Title' })
        .expect(200);

      const parsed = ResourceSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
    });

    it('should return 403 when user is not owner', async () => {
      const forbiddenResource = { ...mockResource, created_by: 999 };
      app.prisma.resource.findUnique.mockResolvedValue(forbiddenResource);

      await request(app.httpServer)
        .patch('/biblioteca/recursos/1')
        .set('Authorization', authHeader())
        .send({ titulo: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /biblioteca/recursos/:id', () => {
    it('should delete resource and return confirmation', async () => {
      app.prisma.resource.findUnique.mockResolvedValue(mockResource);
      app.prisma.resource.delete.mockResolvedValue(mockResource);

      const res = await request(app.httpServer)
        .delete('/biblioteca/recursos/1')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = DeleteResourceResponseSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.message).toBe('Recurso eliminado');
    });
  });

  describe('POST /biblioteca/recursos/:id/comentarios', () => {
    it('should add comment and return matching contract', async () => {
      app.prisma.resource.findUnique.mockResolvedValue(mockResource);
      app.prisma.user.findUnique.mockResolvedValue(mockProgramAccess);
      app.prisma.resource_comment.create.mockResolvedValue({
        id_comment: 1, id_resource: 1, id_user: 1, contenido: 'Great resource!',
        created_at: new Date(),
        user: { id_user: 1, full_name: 'Test User' },
      });

      const res = await request(app.httpServer)
        .post('/biblioteca/recursos/1/comentarios')
        .set('Authorization', authHeader())
        .send({ contenido: 'Great resource!' })
        .expect(201);

      const parsed = CommentResponseSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
    });
  });

  describe('POST /biblioteca/recursos/:id/valoracion', () => {
    it('should rate resource and return matching contract', async () => {
      app.prisma.resource.findUnique.mockResolvedValue(mockResource);
      app.prisma.user.findUnique.mockResolvedValue(mockProgramAccess);
      app.prisma.resource_rating.upsert.mockResolvedValue({
        id_rating: 1, id_resource: 1, id_user: 1, valor: 4,
      });

      const res = await request(app.httpServer)
        .post('/biblioteca/recursos/1/valoracion')
        .set('Authorization', authHeader())
        .send({ valor: 4 })
        .expect(200);

      const parsed = RatingResponseSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.valor).toBe(4);
    });
  });
});
