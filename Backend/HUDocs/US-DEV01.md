# US-DEV01 — Documentación viva del API: OpenAPI 3 + tipos TypeScript autogenerados

---

## Tarea 1 — Swagger UI completo con metadatos y @ApiResponse en controladores

**Prompt Sugerido:**
Enriquecer `Backend/src/main.ts` para exportar `buildSwaggerConfig()` reutilizable. Agregar `addServer()` para entornos local y producción, `persistAuthorization`, `tagsSorter`. En `Backend/src/resources/biblioteca.controller.ts`, agregar `@ApiResponse` para códigos 200/201/400/401/403/404 en todos los métodos, y `@ApiParam` con descripción en rutas parametrizadas. El objetivo es que la interfaz Swagger UI en `/docs` sea completamente autoexplicativa sin consultar código fuente.

**Commit:** `feat(docs): CA1 — Swagger UI completo con servidores, respuestas y decoradores en biblioteca`

**Estimación:** 1 h

---

## Tarea 2 — Script generate:openapi que regenera openapi.json tras el build

**Prompt Sugerido:**
Crear `Backend/scripts/generate-openapi.ts`: importar `NestFactory` y `buildSwaggerConfig`, levantar el `AppModule` con `logger: false`, extraer el documento Swagger con `SwaggerModule.createDocument`, serializar con `JSON.stringify` y escribir simultáneamente en `openspec/openapi.json` (fuente de verdad del monorepo) y `Backend/openapi.json` (versionado con el release). Reemplazar el script `"build"` en `package.json` por `"nest build && npm run generate:openapi"`. Ejecutar el script y validar que se generan ambos archivos.

**Commit:** `feat(docs): CA2 — script generate:openapi y openapi.json inicial comprometido`

**Estimación:** 1.5 h

---

## Tarea 3 — Paquete @uniconnect/api-types con tipos generados por openapi-typescript

**Prompt Sugerido:**
Crear `packages/api-types/` como nuevo workspace npm. `package.json` debe incluir `openapi-typescript` como devDependency y el script `"generate": "openapi-typescript ../../openspec/openapi.json -o src/openapi.d.ts"`. Registrar el workspace en el `package.json` raíz. Ejecutar `npm run generate` para producir `src/openapi.d.ts` con todas las interfaces `paths`, `operations` y `components`. Agregar scripts `generate:api-types` y `typecheck:api-types` en el `package.json` raíz.

**Commit:** `feat(api-types): CA3/CA4/CA5 — paquete @uniconnect/api-types con tipos OpenAPI y validador Zod`

**Estimación:** 2 h

---

## Tarea 4 — Validador Zod de respuestas (CA5) y esquemas de recursos en @uniconnect/shared

**Prompt Sugerido:**
Crear `packages/api-types/src/validate.ts` con la función `validateApiResponse<T>(schema: ZodSchema, data: unknown): T` que hace `schema.safeParse(data)` y lanza `ApiValidationError` (extendiendo `Error`) con los `ZodIssue[]` si falla. Crear `Frontend/shared/src/validators/resources.validator.ts` con `ResourceSchema`, `ResourceArraySchema`, `TipoContenidoSchema` y sub-esquemas para decoradores. Exportar desde `validators/index.ts`.

**Commit:** (incluido en Tarea 3 como commit único)

**Estimación:** 1 h

---

## Tarea 5 — Estrategia SemVer para historial de contratos (CA6)

**Prompt Sugerido:**
Crear `Backend/scripts/release.sh`: acepta `patch|minor|major` como argumento, ejecuta `npm version $BUMP --no-git-tag-version`, regenera `openapi.json` con `npm run generate:openapi`, copia el spec a `openspec/versions/${NEW_VERSION}/openapi.json` para historial recuperable, y crea el commit + tag git. Archivar `openspec/versions/v0.0.1/openapi.json` como primer snapshot comprometido.

**Commit:** `feat(docs): CA6 — estrategia SemVer para openapi.json versionado históricamente`

**Estimación:** 0.5 h

---

## Tarea 6 — README del backend con guía de incorporación (CA7)

**Prompt Sugerido:**
Reescribir `Backend/README.md` con una sección "Flujo para agregar un nuevo endpoint" que cubra 7 pasos concretos: (1) crear DTO con `@ApiProperty`, (2) decorar el controlador con `@ApiOperation` y `@ApiResponse`, (3) registrar el módulo, (4) ejecutar `npm run generate:openapi`, (5) ejecutar `npm run generate:api-types`, (6) ejecutar `npm run typecheck:all` para verificar que los clientes no rompen, (7) ejemplo de consumo en web/mobile con `paths[...]` y `validateApiResponse`. Incluir tabla de variables de entorno, URLs de Swagger y sección de release SemVer.

**Commit:** `docs(backend): CA7 — README con guía paso a paso para agregar endpoints y consumir api-types`

**Estimación:** 1 h
