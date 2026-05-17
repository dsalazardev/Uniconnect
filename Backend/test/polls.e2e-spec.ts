import { buildTestApp, request, TestApp } from './helpers/test-app.builder';
import { signTestJwt } from './helpers/jwt-test.helper';
import { PollSchema, PollFENResponseSchema } from '@uniconnect/shared';

describe('Polls (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => { app = await buildTestApp(); });
  afterAll(async () => { await app.close(); });

  const authHeader = () => `Bearer ${signTestJwt(1)}`;

  const mockPoll = {
    id_poll: 1, id_group: 1, created_by: 1, question: 'Best framework?',
    closes_at: new Date('2099-12-31'), status: 'ACTIVE', created_at: new Date(),
    options: [
      { id_option: 1, text: 'NestJS', votes: [] },
      { id_option: 2, text: 'Express', votes: [] },
    ],
    votes: [],
  };

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  describe('POST /groups/:groupId/polls', () => {
    it('should create a poll and return it matching Poll contract', async () => {
      app.prisma.poll.create.mockResolvedValue(mockPoll);
      app.prisma.membership.findFirst.mockResolvedValue({ id_membership: 1 });

      const res = await request(app.httpServer)
        .post('/groups/1/polls')
        .set('Authorization', authHeader())
        .send({
          question: 'Best framework?',
          options: ['NestJS', 'Express'],
          closesAt: futureDate.toISOString(),
        })
        .expect(201);

      const parsed = PollSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.question).toBe('Best framework?');
      expect(parsed.data!.options).toHaveLength(2);
    });

    it('should reject past closesAt with 400', async () => {
      await request(app.httpServer)
        .post('/groups/1/polls')
        .set('Authorization', authHeader())
        .send({
          question: 'Test',
          options: ['A', 'B'],
          closesAt: '2020-01-01T00:00:00.000Z',
        })
        .expect(400);
    });

    it('should reject with less than 2 options with 400', async () => {
      await request(app.httpServer)
        .post('/groups/1/polls')
        .set('Authorization', authHeader())
        .send({
          question: 'Test',
          options: ['Only One'],
          closesAt: futureDate.toISOString(),
        })
        .expect(400);
    });

    it('should reject request without auth with 401', async () => {
      await request(app.httpServer)
        .post('/groups/1/polls')
        .send({
          question: 'Test', options: ['A', 'B'], closesAt: futureDate.toISOString(),
        })
        .expect(401);
    });
  });

  describe('POST /polls/:pollId/vote', () => {
    it('should cast vote and return updated poll matching contract', async () => {
      app.prisma.poll.findUnique.mockResolvedValue(mockPoll);
      app.prisma.poll_vote.findFirst.mockResolvedValue(null);
      app.prisma.poll_vote.create.mockResolvedValue({
        id_vote: 1, id_poll: 1, id_user: 1, id_option: 1, created_at: new Date(),
      });
      app.prisma.poll_vote.findMany.mockResolvedValue([
        { id_option: 1, id_user: 1 },
      ]);

      const res = await request(app.httpServer)
        .post('/polls/1/vote')
        .set('Authorization', authHeader())
        .send({ optionId: 1 })
        .expect(200);

      const parsed = PollSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.userVote).toBe(1);
    });

    it('should return 409 when user already voted', async () => {
      app.prisma.poll.findUnique.mockResolvedValue(mockPoll);
      app.prisma.poll_vote.findFirst.mockResolvedValue({
        id_vote: 1, id_poll: 1, id_user: 1, id_option: 1,
      });

      await request(app.httpServer)
        .post('/polls/1/vote')
        .set('Authorization', authHeader())
        .send({ optionId: 2 })
        .expect(409);
    });

    it('should return 404 for non-existent poll', async () => {
      app.prisma.poll.findUnique.mockResolvedValue(null);

      await request(app.httpServer)
        .post('/polls/999/vote')
        .set('Authorization', authHeader())
        .send({ optionId: 1 })
        .expect(404);
    });
  });

  describe('GET /polls/:pollId', () => {
    it('should return poll matching Poll contract', async () => {
      app.prisma.poll.findUnique.mockResolvedValue(mockPoll);

      const res = await request(app.httpServer)
        .get('/polls/1')
        .set('Authorization', authHeader())
        .expect(200);

      const parsed = PollSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.id).toBe(1);
    });

    it('should return 404 for non-existent poll', async () => {
      app.prisma.poll.findUnique.mockResolvedValue(null);

      await request(app.httpServer)
        .get('/polls/999')
        .set('Authorization', authHeader())
        .expect(404);
    });
  });
});
