import { buildTestApp, TestApp, request } from './helpers/test-app.builder';
import { signTestJwt } from './helpers/jwt-test.helper';

describe('Events (e2e)', () => {
  let app: TestApp;
  let token: string;

  beforeAll(async () => {
    app = await buildTestApp();
    token = signTestJwt(1);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/events (GET)', () => {
    it('should return events array when authorized', async () => {
      app.prisma.event.findMany.mockResolvedValue([]);

      const response = await request(app.httpServer)
        .get('/events')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by categoryId query param', async () => {
      app.prisma.event.findMany.mockResolvedValue([]);

      const response = await request(app.httpServer)
        .get('/events')
        .set('Authorization', `Bearer ${token}`)
        .query({ categoryId: '1' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      await request(app.httpServer)
        .get('/events')
        .expect(401);
    });

    it('should include creator info in response', async () => {
      const mockEvents = [
        {
          id_event: 1,
          title: 'Conferencia',
          description: 'Desc',
          start_date: new Date('2024-03-15'),
          end_date: new Date('2024-03-15'),
          id_category: 1,
          category: { id_category: 1, name: 'ACADEMICO' },
          creator: { id_user: 1, full_name: 'Test User', picture: null },
          created_by: 1,
        },
      ];
      app.prisma.event.findMany.mockResolvedValue(mockEvents);

      const response = await request(app.httpServer)
        .get('/events')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body[0]).toHaveProperty('creator');
      expect(response.body[0].creator.full_name).toBe('Test User');
    });
  });
});
