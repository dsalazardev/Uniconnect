## Why

The Docker build pipeline for the Backend fails on Render because `npm run generate:openapi` (chained via `&&` after `nest build`) calls `NestFactory.create(AppModule)`, which bootstraps the entire NestJS application — including `JwtModule` and `PrismaService`. Since `.env` is excluded from the Docker build context via `.dockerignore`, environment variables like `JWT_SECRET` and `DATABASE_URL` are undefined, causing the `JwtModule` async factory to throw and exit with code 1. The build never reaches production.

## What Changes

- **`scripts/generate-openapi.ts`**: Inject mock environment variables (`JWT_SECRET`, `DATABASE_URL`) and a build flag (`IS_BUILDING_OPENAPI`) at the top of the script, before `NestFactory.create()` is called, so that `ConfigModule` and `JwtModule` can initialize without crashing.
- **`src/prisma/prisma.service.ts`**: Add an early-return guard in `onModuleInit()` that skips `$connect()` when `IS_BUILDING_OPENAPI === 'true'`, preventing Prisma from attempting a database connection that doesn't exist during OpenAPI generation.
- **No changes to `src/auth/auth.module.ts`**: The mock env vars alone will satisfy `JwtModule.registerAsync`, so no code change is needed in the auth module.
- **No changes to `Dockerfile`**: The fix is entirely in-code; no build-stage env injection required.

## Capabilities

### New Capabilities
- `openapi-build-resilience`: Mechanism to generate the OpenAPI Swagger document without requiring a live database or real secrets, enabling the build pipeline to complete in containerized CI/CD environments.

### Modified Capabilities
*(None — no spec-level behavior changes; this is an infrastructure/build fix.)*

## Impact

- **Build pipeline**: `nest build && npm run generate:openapi` will complete successfully on Render. No Dockerfile changes needed.
- **Backend source**: Minimal — one guard in `prisma.service.ts`, env var injection in `generate-openapi.ts`.
- **Runtime**: Zero impact. The `IS_BUILDING_OPENAPI` flag is never set outside the build script, so `PrismaService.$connect()` runs normally in production.
- **OpenAPI artifact**: Still generated at build time and shipped in the Docker image. No change to the output or its consumers.
