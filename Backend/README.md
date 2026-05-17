# Uniconnect Core — Backend API

NestJS backend de la plataforma Uniconnect — red social universitaria.

## Integrantes

- Luis Miguel Henao
- Jaime Andrés Cardona
- Daner Alejandro Salazar
- Mariana López

## Tecnologías

- **NestJS 11** + TypeScript 5
- **Prisma ORM 7** — PostgreSQL
- **@nestjs/swagger 11** — documentación OpenAPI 3
- **Docker** — contenedores de desarrollo y producción

---

## Instalación y Ejecución

### Desarrollo Local

```bash
pnpm install
cp .env.example .env   # configura las variables de entorno
pnpm run start:dev     # arranca con hot-reload en http://localhost:8007
```

### Con Docker

```bash
docker-compose build
docker-compose up
```

### Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secreto para firmar JWT |
| `AUTH0_DOMAIN` | Dominio de Auth0 |
| `PORT` | Puerto del servidor (default: 8007) |

---

## Documentación de la API (OpenAPI 3)

Con el backend corriendo, accede a:

| URL | Descripción |
|---|---|
| `http://localhost:8007/docs` | Swagger UI interactivo |
| `http://localhost:8007/docs-json` | Especificación JSON cruda |
| `http://localhost:8007/docs-yaml` | Especificación YAML cruda |

El archivo `openapi.json` en la raíz del backend y en `openspec/openapi.json` es la **fuente de verdad** del contrato.

---

## Flujo para agregar un nuevo endpoint

### Paso 1 — Crea o modifica el DTO

```typescript
// src/mi-modulo/dto/create-cosa.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCosaDto {
  @ApiProperty({ example: 'Mi título', description: 'Título de la cosa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @ApiPropertyOptional({ example: 'Descripción opcional' })
  descripcion?: string;
}
```

### Paso 2 — Agrega `@ApiTags`, `@ApiOperation` y `@ApiResponse` al controlador

```typescript
// src/mi-modulo/mi-modulo.controller.ts
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('mi-modulo')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('cosas')
export class MiModuloController {

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una cosa nueva' })
  @ApiResponse({ status: 201, description: 'Cosa creada', type: CreateCosaDto })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  crear(@Body() dto: CreateCosaDto) {
    return this.service.crear(dto);
  }
}
```

### Paso 3 — Registra el módulo en `app.module.ts` (si es nuevo)

```typescript
@Module({
  imports: [
    // ...módulos existentes
    MiModuloModule,
  ],
})
export class AppModule {}
```

### Paso 4 — Regenera `openapi.json` automáticamente

```bash
# Desde la raíz del backend
npm run generate:openapi
# → Escribe openspec/openapi.json y Backend/openapi.json
```

El script levanta el AppModule en modo silencioso, extrae el documento Swagger y lo serializa.
**No requiere pasos manuales** — se ejecuta también como postbuild (`npm run build`).

### Paso 5 — Regenera los tipos TypeScript en `@uniconnect/api-types`

```bash
# Desde la raíz del monorepo
npm run generate:api-types
# → Actualiza packages/api-types/src/openapi.d.ts con 100 % de los tipos del spec
```

### Paso 6 — Verifica que web y mobile compilan con el contrato nuevo

```bash
npm run typecheck:all
# Si algún campo cambió de nombre o tipo, TypeScript falla aquí ← intencional (CA4)
```

### Paso 7 — Usa el tipo en web / mobile

```typescript
// Ejemplo en web (Frontend-web) o mobile (Frontend-mobile)
import type { paths } from '@uniconnect/api-types';
import { validateApiResponse } from '@uniconnect/api-types';
import { ResourceArraySchema } from '@uniconnect/shared';

// Tipo inferido exactamente desde el spec (CA4)
type RecursoRespuesta =
  paths['/api/biblioteca/programas/{id}/recursos']['get']['responses']['200']['content']['application/json'];

// Validación Zod en runtime antes de pintar la UI (CA5)
const resources = validateApiResponse(ResourceArraySchema, response.data);
```

---

## Publicar un release (CA6 — historial de contratos)

```bash
# Desde la raíz del backend
bash scripts/release.sh patch   # o minor / major

# El script:
# 1. Bumps package.json (npm version)
# 2. Regenera openapi.json con la versión nueva
# 3. Archiva el spec en openspec/versions/<X.Y.Z>/openapi.json
# 4. Crea commit + git tag
```

Para recuperar el contrato exacto de cualquier versión histórica:

```bash
git show v0.0.1:openspec/versions/v0.0.1/openapi.json
# o simplemente navega openspec/versions/ en el repositorio
```

---

## Scripts de Mantenimiento

### Limpieza de invitaciones y solicitudes

```bash
npx ts-node scripts/clean-invitations.ts
```

- Elimina invitaciones/solicitudes rechazadas con más de 30 días
- Ejecutar en horarios de bajo tráfico y con backup previo

---

## Estructura del proyecto

```
Backend/
├── src/
│   ├── main.ts              # Bootstrap + buildSwaggerConfig()
│   ├── app.module.ts        # Módulo raíz
│   ├── auth/                # Autenticación JWT + Auth0
│   ├── events/              # Eventos académicos (patrón Observer)
│   ├── groups/              # Grupos de estudio
│   ├── resources/           # Biblioteca de recursos (patrón Decorator)
│   └── ...
├── scripts/
│   ├── generate-openapi.ts  # CA2 — exporta openapi.json sin levantar puerto
│   └── release.sh           # CA6 — bump SemVer + archivado del spec
├── openapi.json             # Spec versionado junto al código (CA6)
└── HUDocs/                  # Documentación de historias de usuario
```
