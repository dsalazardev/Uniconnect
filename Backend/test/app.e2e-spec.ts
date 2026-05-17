import { buildTestApp, TestApp, request } from './helpers/test-app.builder';

describe('AppController (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.httpServer)
      .get('/health')
      .expect(200)
      .expect('Hello World!');
  });
});
