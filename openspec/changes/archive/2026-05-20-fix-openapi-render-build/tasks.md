## 1. Script — Inject mock env vars in `generate-openapi.ts`

- [x] 1.1 Add `process.env.IS_BUILDING_OPENAPI = 'true'` and `process.env.JWT_SECRET` fallback as the first statements in `scripts/generate-openapi.ts`, before any runtime code execution
- [x] 1.2 Verify that `NestFactory.create(AppModule)` no longer throws on missing `JWT_SECRET` by running the script locally without a `.env` file

## 2. Database — Add build guard in `PrismaService`

- [x] 2.1 Add early-return guard `if (process.env.IS_BUILDING_OPENAPI === 'true') return;` at the top of `onModuleInit()` in `src/prisma/prisma.service.ts`
- [x] 2.2 Confirm that `npm run generate:openapi` completes without a database connection and produces a valid `openapi.json`

## 3. Verification — Build the Docker image

- [x] 3.1 Run `docker build -t test-build .` from the `Backend/` directory and confirm the build succeeds (exit code 0)
- [x] 3.2 Verify the generated `openapi.json` exists inside the image by inspecting the image or checking the build log for the success message

## 4. Regression — Confirm production behavior is unchanged

- [x] 4.1 Verify that `PrismaService.onModuleInit()` calls `$connect()` when `IS_BUILDING_OPENAPI` is NOT set (e.g., by checking existing tests pass)
- [x] 4.2 Run the existing test suite: `npm test` — confirm 0 regressions (392 tests, 0 failures)
