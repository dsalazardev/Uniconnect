/**
 * CA2 — Genera openapi.json a partir de los decoradores NestJS/Swagger.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register scripts/generate-openapi.ts
 *
 * O desde npm:
 *   npm run generate:openapi
 *
 * El archivo resultante se escribe en <raiz-monorepo>/openspec/openapi.json
 * y también en Backend/openapi.json para que quede versionado junto al código.
 *
 * NOTA: Usa require() en lugar de import para garantizar que las variables de
 * entorno mock se inyecten ANTES de que NestJS resuelva AppModule (los imports
 * estáticos son hoisted y se ejecutan antes que el código a nivel de módulo).
 */

async function generate() {
  // ─── Build-time env vars ──────────────────────────────────────────
  // These mock values prevent modules from crashing during OpenAPI
  // generation when .env is not present (e.g. Docker build).
  // MUST be set before any require() call inside this function.
  process.env.IS_BUILDING_OPENAPI = 'true';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'openapi-build-mock-secret';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://build:dummy@localhost:5432/build';
  process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  process.env.AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'uniconnect-build-dummy';
  // ──────────────────────────────────────────────────────────────────

  // Dynamic require() — guaranteed to run after env var injection above
  const { NestFactory } = require('@nestjs/core');
  const { SwaggerModule } = require('@nestjs/swagger');
  const { writeFileSync, mkdirSync } = require('fs');
  const { join } = require('path');
  const { AppModule } = require('../src/app.module');
  const { buildSwaggerConfig } = require('../src/main');

  // Silencia los logs de arranque para no contaminar stdout
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());

  // Destino 1: openspec/ en la raíz del monorepo (fuente de verdad para api-types)
  const monorepoRoot = join(__dirname, '..', '..', 'openspec');
  mkdirSync(monorepoRoot, { recursive: true });
  writeFileSync(join(monorepoRoot, 'openapi.json'), JSON.stringify(document, null, 2));

  // Destino 2: raíz del Backend para versionado SemVer (CA6)
  writeFileSync(join(__dirname, '..', 'openapi.json'), JSON.stringify(document, null, 2));

  console.log(`✅  openapi.json generado — versión ${document.info.version}`);

  await app.close();
}

generate().catch((err) => {
  console.error('❌  Error generando openapi.json:', err);
  process.exit(1);
});
