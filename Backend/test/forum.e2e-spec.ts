import { buildTestApp, request, TestApp } from './helpers/test-app.builder';
import { signTestJwt } from './helpers/jwt-test.helper';
import { ForumQuestionArraySchema, ForumQuestionSchema, ForumAnswerArraySchema, ForumAnswerSchema } from '@uniconnect/shared';

describe('Forum (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => { app = await buildTestApp(); });
  afterAll(async () => { await app.close(); });

  const authHeader = () => `Bearer ${signTestJwt(1)}`;

  const mockAuthor = { id_user: 1, full_name: 'Test User', picture: null };
  const mockQuestion = {
    id_question: 1, id_course: 1, id_user: 1, title: 'Test Question', body: 'Test body content',
    status: 'OPEN', vote_count: 0, answer_count: 0, created_at: new Date(),
    author: mockAuthor,
  };
  const mockAnswer = {
    id_answer: 1, id_question: 1, id_user: 2, body: 'Test answer body',
    vote_count: 0, is_accepted: false, created_at: new Date(),
    author: { id_user: 2, full_name: 'Answerer', picture: null },
  };
  const mockEnrollment = { id_enrollment: 1, id_user: 1, id_course: 1, status: 'ACTIVE' };

  describe('GET /courses/:courseId/forum/questions', () => {
    it('should return questions matching ForumQuestion contract', async () => {
      app.prisma.forum_question.findMany.mockResolvedValue([mockQuestion]);
      app.prisma.forum_vote.findMany.mockResolvedValue([]);

      const res = await request(app.httpServer)
        .get('/courses/1/forum/questions')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = ForumQuestionArraySchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveLength(1);
      expect(parsed.data![0].title).toBe('Test Question');
    });

    it('should return empty array when no questions exist', async () => {
      app.prisma.forum_question.findMany.mockResolvedValue([]);
      app.prisma.forum_vote.findMany.mockResolvedValue([]);

      const res = await request(app.httpServer)
        .get('/courses/1/forum/questions')
        .set('Authorization', authHeader())
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('POST /courses/:courseId/forum/questions', () => {
    it('should create a question and return it matching ForumQuestion contract', async () => {
      app.prisma.forum_question.create.mockResolvedValue(mockQuestion);
      app.prisma.enrollment.findFirst.mockResolvedValue(mockEnrollment);

      const res = await request(app.httpServer)
        .post('/courses/1/forum/questions')
        .set('Authorization', authHeader())
        .send({ title: 'Test Question', body: 'Test body content' })
        .expect(201);

      const parsed = ForumQuestionSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
    });

    it('should reject empty title with 400', async () => {
      const res = await request(app.httpServer)
        .post('/courses/1/forum/questions')
        .set('Authorization', authHeader())
        .send({ title: '', body: 'Body' })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('should reject request without auth with 401', async () => {
      await request(app.httpServer)
        .post('/courses/1/forum/questions')
        .send({ title: 'Test', body: 'Body' })
        .expect(401);
    });
  });

  describe('GET /forum/questions/:questionId/answers', () => {
    it('should return answers matching ForumAnswer contract', async () => {
      app.prisma.forum_question.findUnique.mockResolvedValue(mockQuestion);
      app.prisma.forum_answer.findMany.mockResolvedValue([mockAnswer]);
      app.prisma.forum_vote.findMany.mockResolvedValue([]);

      const res = await request(app.httpServer)
        .get('/forum/questions/1/answers')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = ForumAnswerArraySchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveLength(1);
    });

    it('should return 404 for non-existent question', async () => {
      app.prisma.forum_question.findUnique.mockResolvedValue(null);

      await request(app.httpServer)
        .get('/forum/questions/999/answers')
        .set('Authorization', authHeader())
        .expect(404);
    });
  });

  describe('POST /forum/questions/:questionId/answers', () => {
    it('should create an answer and return it matching ForumAnswer contract', async () => {
      app.prisma.forum_question.findUnique.mockResolvedValue(mockQuestion);
      app.prisma.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      app.prisma.forum_answer.create.mockResolvedValue(mockAnswer);

      const res = await request(app.httpServer)
        .post('/forum/questions/1/answers')
        .set('Authorization', authHeader())
        .send({ body: 'Test answer body' })
        .expect(201);

      const parsed = ForumAnswerSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
    });

    it('should reject empty answer body with 400', async () => {
      await request(app.httpServer)
        .post('/forum/questions/1/answers')
        .set('Authorization', authHeader())
        .send({ body: '' })
        .expect(400);
    });
  });

  describe('POST /forum/questions/:questionId/vote', () => {
    it('should toggle vote and return updated question matching contract', async () => {
      app.prisma.forum_question.findUnique.mockResolvedValue(mockQuestion);
      app.prisma.forum_vote.findFirst.mockResolvedValue(null);
      app.prisma.forum_vote.create.mockResolvedValue({ id_vote: 1, id_user: 1, entity_type: 'QUESTION', entity_id: 1, created_at: new Date() });
      app.prisma.forum_vote.count.mockResolvedValue(1);
      app.prisma.forum_question.update.mockResolvedValue({ ...mockQuestion, vote_count: 1 });

      const res = await request(app.httpServer)
        .post('/forum/questions/1/vote')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = ForumQuestionSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.voteCount).toBe(1);
    });

    it('should return 404 for non-existent question', async () => {
      app.prisma.forum_question.findUnique.mockResolvedValue(null);

      await request(app.httpServer)
        .post('/forum/questions/999/vote')
        .set('Authorization', authHeader())
        .expect(404);
    });
  });

  describe('POST /forum/answers/:answerId/vote', () => {
    it('should toggle vote and return updated answer matching contract', async () => {
      app.prisma.forum_answer.findUnique.mockResolvedValue({ ...mockAnswer, question: { id_course: 1 } });
      app.prisma.forum_vote.findFirst.mockResolvedValue(null);
      app.prisma.forum_vote.create.mockResolvedValue({ id_vote: 1, id_user: 1, entity_type: 'ANSWER', entity_id: 1, created_at: new Date() });
      app.prisma.forum_vote.count.mockResolvedValue(1);
      app.prisma.forum_answer.update.mockResolvedValue({ ...mockAnswer, vote_count: 1 });

      const res = await request(app.httpServer)
        .post('/forum/answers/1/vote')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = ForumAnswerSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
    });
  });

  describe('PATCH /forum/answers/:answerId/accept', () => {
    it('should accept answer and return it matching contract', async () => {
      app.prisma.forum_answer.findUnique
        .mockResolvedValueOnce({ ...mockAnswer, question: { id_course: 1 } });
      app.prisma.membership.findFirst.mockResolvedValue({ id_membership: 1, is_admin: true });
      app.prisma.forum_answer.updateMany.mockResolvedValue({ count: 1 });
      const updatedAnswer = { ...mockAnswer, is_accepted: true };
      app.prisma.forum_answer.update.mockResolvedValue(updatedAnswer);
      app.prisma.forum_question.update.mockResolvedValue({ ...mockQuestion, status: 'RESOLVED' });
      app.prisma.$transaction.mockImplementation(
        (promises: any[]) => Promise.all(promises)
      );

      const res = await request(app.httpServer)
        .patch('/forum/answers/1/accept')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = ForumAnswerSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.isAccepted).toBe(true);
    });

    it('should return 403 when user is not teacher', async () => {
      app.prisma.forum_answer.findUnique
        .mockResolvedValueOnce({ ...mockAnswer, question: { id_course: 1 } });
      app.prisma.membership.findFirst.mockResolvedValue(null);

      await request(app.httpServer)
        .patch('/forum/answers/1/accept')
        .set('Authorization', authHeader())
        .expect(403);
    });
  });
});
