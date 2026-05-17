import { buildTestApp, request, TestApp } from './helpers/test-app.builder';
import { signTestJwt } from './helpers/jwt-test.helper';
import {
  StudySessionInstanceArraySchema,
  StudySessionInstanceSchema,
  CancelInstanceResponseSchema,
  AttendanceResponseSchema,
} from '@uniconnect/shared';

describe('Study Sessions (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => { app = await buildTestApp(); });
  afterAll(async () => { await app.close(); });

  const authHeader = () => `Bearer ${signTestJwt(1)}`;

  const mockGroup = { id_group: 1, name: 'Test Group', owner_id: 1 };
  const mockSession = {
    id_session: 1, id_group: 1, created_by: 1, title: 'Study Session',
    description: 'Let us study', start_datetime: new Date('2099-01-01'),
    duration_minutes: 60, recurrence_type: 'NONE', recurrence_end_date: null,
    created_at: new Date(),
  };
  const mockInstance = {
    id_instance: 1, id_session: 1, scheduled_date: new Date('2099-01-01'),
    status: 'ACTIVE', reminder_sent: false, cancelled_at: null, cancelled_by: null,
  };

  describe('POST /groups/:groupId/study-sessions', () => {
    it('should create sessions and return instances matching contract', async () => {
      app.prisma.group.findUnique.mockResolvedValue(mockGroup);
      app.prisma.study_session.create.mockResolvedValue(mockSession);
      app.prisma.study_session_instance.createMany.mockResolvedValue({ count: 1 });
      app.prisma.study_session_instance.findMany.mockResolvedValue([mockInstance]);
      app.prisma.membership.findMany.mockResolvedValue([]);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const res = await request(app.httpServer)
        .post('/groups/1/study-sessions')
        .set('Authorization', authHeader())
        .send({
          title: 'Study Session',
          startDatetime: futureDate.toISOString(),
          durationMinutes: 60,
          recurrenceType: 'NONE',
        })
        .expect(201);

      const parsed = StudySessionInstanceArraySchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveLength(1);
      expect(parsed.data![0].title).toBe('Study Session');
    });

    it('should reject past date with 400', async () => {
      await request(app.httpServer)
        .post('/groups/1/study-sessions')
        .set('Authorization', authHeader())
        .send({
          title: 'Past Session',
          startDatetime: '2020-01-01T00:00:00.000Z',
          durationMinutes: 60,
          recurrenceType: 'NONE',
        })
        .expect(400);
    });

    it('should reject request without auth with 401', async () => {
      await request(app.httpServer)
        .post('/groups/1/study-sessions')
        .send({ title: 'Test', startDatetime: '2099-01-01T00:00:00.000Z', durationMinutes: 60, recurrenceType: 'NONE' })
        .expect(401);
    });
  });

  describe('GET /groups/:groupId/study-sessions', () => {
    it('should return sessions matching StudySessionInstance array contract', async () => {
      app.prisma.study_session_instance.findMany.mockResolvedValue([{
        ...mockInstance,
        session: mockSession,
        attendances: [],
      }]);

      const res = await request(app.httpServer)
        .get('/groups/1/study-sessions')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = StudySessionInstanceArraySchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveLength(1);
    });

    it('should return empty array when no sessions exist', async () => {
      app.prisma.study_session_instance.findMany.mockResolvedValue([]);

      const res = await request(app.httpServer)
        .get('/groups/1/study-sessions')
        .set('Authorization', authHeader())
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('DELETE /groups/:groupId/study-sessions/:instanceId', () => {
    it('should cancel instance and return confirmation', async () => {
      app.prisma.study_session_instance.findUnique.mockResolvedValue({
        ...mockInstance,
        session: { ...mockSession, group: { owner_id: 1 } },
      });
      app.prisma.study_session_instance.update.mockResolvedValue({
        ...mockInstance, status: 'CANCELLED',
      });
      app.prisma.membership.findMany.mockResolvedValue([]);

      const res = await request(app.httpServer)
        .delete('/groups/1/study-sessions/1')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = CancelInstanceResponseSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.cancelled).toBe(true);
    });
  });

  describe('PATCH /groups/:groupId/study-sessions/:instanceId/attendance', () => {
    it('should update attendance and return matching contract', async () => {
      app.prisma.study_session_instance.findUnique.mockResolvedValue({
        ...mockInstance,
        session: mockSession,
      });
      app.prisma.session_attendance.upsert.mockResolvedValue({
        id_attendance: 1, id_instance: 1, id_user: 1,
        status: 'CONFIRMED', updated_at: new Date(),
      });

      const res = await request(app.httpServer)
        .patch('/groups/1/study-sessions/1/attendance')
        .set('Authorization', authHeader())
        .send({ status: 'CONFIRMED' })
        .expect(200);

      const parsed = AttendanceResponseSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.status).toBe('CONFIRMED');
    });
  });
});
