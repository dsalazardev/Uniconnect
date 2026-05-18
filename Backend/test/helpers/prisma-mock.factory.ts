/**
 * Extended Prisma mock factory for Sprint 4 integration tests.
 * Extends the canonical createPrismaMock() with Sprint 4 models.
 */

type MockFn = jest.Mock;

interface ModelMock {
  findUnique: MockFn;
  findFirst: MockFn;
  findMany: MockFn;
  create: MockFn;
  createMany: MockFn;
  update: MockFn;
  updateMany: MockFn;
  delete: MockFn;
  deleteMany: MockFn;
  count: MockFn;
  upsert: MockFn;
}

export interface Sprint4PrismaMock {
  // Legacy models (from canonical mock)
  notification: ModelMock;
  group: ModelMock;
  membership: ModelMock;
  user: ModelMock;
  message: ModelMock;
  connection: ModelMock;
  group_invitation: ModelMock;
  group_join_request: ModelMock;
  course: ModelMock;
  enrollment: ModelMock;

  // Auth dependencies
  token_blacklist: ModelMock;

  // Sprint 4: Forum
  forum_question: ModelMock;
  forum_answer: ModelMock;
  forum_vote: ModelMock;

  // Sprint 4: Biblioteca
  resource: ModelMock;
  resource_tag: ModelMock;
  resource_rating: ModelMock;
  resource_comment: ModelMock;

  // Sprint 4: Study Sessions
  study_session: ModelMock;
  study_session_instance: ModelMock;
  session_attendance: ModelMock;

  // Legacy model needed by EventsModule
  event: ModelMock;

  // Sprint 4: Polls
  poll: ModelMock;
  poll_option: ModelMock;
  poll_vote: ModelMock;

  // Prisma utilities
  $transaction: MockFn;
}

function createModelMock(): ModelMock {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  };
}

export function createSprint4PrismaMock(): Sprint4PrismaMock {
  return {
    notification: createModelMock(),
    group: createModelMock(),
    membership: createModelMock(),
    user: createModelMock(),
    message: createModelMock(),
    connection: createModelMock(),
    group_invitation: createModelMock(),
    group_join_request: createModelMock(),
    course: createModelMock(),
    enrollment: createModelMock(),
    token_blacklist: createModelMock(),
    event: createModelMock(),
    forum_question: createModelMock(),
    forum_answer: createModelMock(),
    forum_vote: createModelMock(),
    resource: createModelMock(),
    resource_tag: createModelMock(),
    resource_rating: createModelMock(),
    resource_comment: createModelMock(),
    study_session: createModelMock(),
    study_session_instance: createModelMock(),
    session_attendance: createModelMock(),
    poll: {
      ...createModelMock(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    poll_option: createModelMock(),
    poll_vote: createModelMock(),
    $transaction: jest.fn(),
  };
}
