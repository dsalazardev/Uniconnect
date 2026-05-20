## Context

The `npm run build` script in `Backend/package.json` chains two steps: `nest build && npm run generate:openapi`. The second step runs `ts-node -r tsconfig-paths/register scripts/generate-openapi.ts`, which calls `NestFactory.create(AppModule)` to bootstrap the full NestJS application for Swagger document generation.

During Docker build on Render, `.env` is excluded by `.dockerignore`, so `process.env` lacks `JWT_SECRET` and `DATABASE_URL`. Two modules fail during initialization:

1. **AuthModule** — `JwtModule.registerAsync` throws `Error('JWT_SECRET environment variable is required')` because `configService.get('JWT_SECRET')` returns `undefined`.
2. **PrismaService** — `onModuleInit()` calls `this.$connect()` against `undefined` connection string.

The `findings.md` document contains the full diagnostic with initialization order diagram.

## Goals / Non-Goals

**Goals:**

- Make `npm run generate:openapi` succeed without a live database or real secrets.
- Keep the OpenAPI artifact generated at build time (shipped in the Docker image).
- Zero impact on production runtime behavior.
- Minimal source changes — prefer environment-level fixes over code refactors.

**Non-Goals:**

- Eliminating the `generate:openapi` step from the build pipeline (it produces valuable artifacts for `api-types`).
- Migrating away from `ts-node` (addressed as a secondary concern).
- Changing the Dockerfile or build stages.
- Adding new dependencies.

## Decisions

### D1 — Env var injection in `generate-openapi.ts` (RC1 fix)

**Decision**: Set `process.env.JWT_SECRET` and `process.env.IS_BUILDING_OPENAPI` at the very top of `generate-openapi.ts`, before any imports resolve.

**Rationale**:
- The script is a standalone utility — it never runs in production. Injecting mock values here is safe and self-contained.
- `ConfigModule.forRoot()` reads from `process.env` at resolution time. Setting values before `NestFactory.create()` ensures they are present when `JwtModule.registerAsync` factory executes.
- Alternative (injecting `ARG`/`ENV` in Dockerfile) was rejected because it leaks build concerns into the deployment configuration and doesn't actually fix the `$connect()` issue.

**Implementation**:
```typescript
// Top of generate-openapi.ts, before imports
process.env.IS_BUILDING_OPENAPI = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'openapi-build-mock-secret';
```

### D2 — Prisma `onModuleInit` guard (RC2 fix)

**Decision**: Add an early-return guard at the start of `PrismaService.onModuleInit()` that checks `process.env.IS_BUILDING_OPENAPI`.

**Rationale**:
- PrismaService is a legitimate NestJS provider injected across the app. We cannot skip its instantiation; we can only prevent it from attempting a DB connection during the build.
- The `IS_BUILDING_OPENAPI` flag is set only in `generate-openapi.ts`. In production or any other context, the flag is absent and `$connect()` runs normally.
- This is a single-line guard with zero overhead (a string comparison).

**Implementation**:
```typescript
async onModuleInit() {
  if (process.env.IS_BUILDING_OPENAPI === 'true') return;
  // ... existing $connect() logic
}
```

### D3 — No Dockerfile changes

**Decision**: Keep the Dockerfile as-is. The fix is entirely self-contained in source code.

**Rationale**:
- The Dockerfile is correct — it runs `nest build && npm run generate:openapi` which is the intended pipeline.
- Adding `ARG`/`ENV` dummy vars would couple build configuration to the fix, making it harder to understand and maintain.
- The code-level fix makes the script inherently resilient regardless of how it's invoked.

### D4 — AuthModule left unchanged

**Decision**: No modifications to `src/auth/auth.module.ts`.

**Rationale**:
- The `JwtModule.registerAsync` factory only needs `JWT_SECRET` to be a non-empty string. With D1 injecting a mock value, the factory succeeds.
- The factory does not validate the JWT or connect to Auth0 — it just configures `@nestjs/jwt` with a signing key. A dummy key satisfies the configuration.
- Modifying the module itself would introduce production risk for no benefit.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `IS_BUILDING_OPENAPI` flag not set before imports execute | Place the `process.env` assignment at the very first line of `generate-openapi.ts`, before any runtime code. Node.js executes top-level statements in order. |
| `ts-node` OOM in Render builder | Mitigated by the env var injection approach (RC1/RC2 are the actual blockers). If OOM surfaces, pre-compile the script: add a `tsc` step to output `scripts/generate-openapi.js` and run that instead. |
| Forgetting to remove guard before production | Impossible — the guard checks for `IS_BUILDING_OPENAPI` which is never set in production. Runtime behavior is identical to current code. |
| Mock JWT_SECRET accidentally used in production | Impossible — `IS_BUILDING_OPENAPI` is set only in `generate-openapi.ts`. Production boot via `main.ts` never triggers this path. |
