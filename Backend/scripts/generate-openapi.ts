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
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { buildSwaggerConfig } from '../src/main';

async function generate() {
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

  // Usar process.exit para evitar que el cierre del gateway WebSocket genere errores
  // en entornos donde el puerto ya está ocupado (p.ej. dev con backend corriendo)
  process.exit(0);
}

generate().catch((err) => {
  console.error('❌  Error generando openapi.json:', err);
  process.exit(1);
});
