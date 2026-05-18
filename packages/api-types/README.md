# @uniconnect/api-types

Tipos TypeScript y utilidades de validación Zod autogenerados desde `openspec/openapi.json`.

## ¿Por qué existe este paquete?

Garantiza que **cualquier cambio de contrato en el backend rompa la compilación** de web y mobile
antes de llegar a runtime (CA4). Complementado con validación Zod en runtime (CA5).

## Uso — CA4: Seguridad de contrato en compilación

```typescript
// Importa los tipos generados desde el spec OpenAPI
import type { paths } from '@uniconnect/api-types';

// El tipo de respuesta se infiere automáticamente desde el spec
type ListarRecursosResponse =
  paths['/api/biblioteca/programas/{id}/recursos']['get']['responses']['200']['content']['application/json'];

// Si el backend cambia el contrato (p. ej. renombra un campo),
// TypeScript falla aquí en tiempo de compilación ← CA4
```

## Uso — CA5: Validación Zod en runtime

```typescript
import { validateApiResponse } from '@uniconnect/api-types';
import { ResourceArraySchema } from '@uniconnect/shared';
import { api } from '@/constants/api';
import { BIBLIOTECA_ENDPOINTS } from '@uniconnect/shared';

const { data } = await api.get(BIBLIOTECA_ENDPOINTS.LIST_BY_PROGRAM(programId));

// Valida la respuesta antes de propagarla a la UI
// Si el backend devuelve datos malformados → lanza ApiValidationError
const resources = validateApiResponse(ResourceArraySchema, data);
```

## Regenerar tipos tras un cambio en el backend

```bash
# 1. Regenerar openapi.json desde el backend
cd Backend && npm run generate:openapi

# 2. Regenerar los tipos TypeScript
cd packages/api-types && npm run generate

# 3. Compilar para detectar errores de contrato
npm run typecheck:all     # desde la raíz del monorepo
```
