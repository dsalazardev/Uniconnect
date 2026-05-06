# Guía de Migración al Monorepo Uniconnect

> **Guía técnica y amigable** para el equipo de desarrollo sobre la nueva arquitectura de monorepo.

## 📖 Índice

1. [¿Por qué un Monorepo?](#por-qué-un-monorepo)
2. [Nueva Estructura](#nueva-estructura)
3. [Setup Inicial](#setup-inicial)
4. [Flujo de Trabajo Diario](#flujo-de-trabajo-diario)
5. [Trabajando con el Paquete Compartido](#trabajando-con-el-paquete-compartido)
6. [Migración de Código Existente](#migración-de-código-existente)
7. [Troubleshooting](#troubleshooting)

---

## ¿Por qué un Monorepo?

### Problema Anterior
- **Duplicación de código**: Types, servicios y validaciones duplicados entre mobile y web
- **Inconsistencias**: Cambios en un frontend no se reflejaban en el otro
- **Mantenimiento costoso**: Actualizar una API requería cambios en múltiples lugares
- **Testing fragmentado**: No había forma de validar todo el código compartido

### Solución: Monorepo con Paquete Compartido
- ✅ **Código compartido**: Types, Services, Validators en un solo lugar (`@uniconnect/shared`)
- ✅ **Sincronización automática**: Cambios en `shared` se reflejan inmediatamente en mobile y web
- ✅ **Type Safety**: Zero-Any Policy aplicada en todo el monorepo
- ✅ **Scripts centralizados**: Comandos globales desde la raíz (`npm run typecheck:all`)
- ✅ **Desarrollo paralelo**: Mobile y Web comparten lógica de negocio sin duplicación

---

## Nueva Estructura

```
uniconnect/
├── package.json                 # ✨ Workspace root (NUEVO)
├── README.md                    # Documentación maestra
├── MIGRATION_GUIDE.md           # Esta guía
├── AGENTS.md                    # Fuente de la verdad técnica
├── Backend/                     # NestJS (sin cambios)
└── Frontend/
    ├── Frontend-mobile/         # React Native + Expo
    │   ├── src/
    │   └── node_modules/
    │       └── @uniconnect/shared  # ✨ Enlazado automáticamente
    ├── Frontend-web/            # React + Vite (NUEVO)
    │   ├── src/
    │   ├── vitest.config.ts
    │   └── node_modules/
    │       └── @uniconnect/shared  # ✨ Enlazado automáticamente
    └── shared/                  # ✨ Paquete compartido (NUEVO)
        ├── src/
        │   ├── types/          # Types compartidos
        │   ├── api/            # Endpoints y Axios factory
        │   ├── services/       # Services con DI
        │   ├── validators/     # Zod validators
        │   └── utils/          # Utilidades
        ├── package.json
        └── tsconfig.json
```

### Cambios Clave

| Antes | Después |
|-------|---------|
| `Frontend/` (solo mobile) | `Frontend/Frontend-mobile/` |
| No existía | `Frontend/Frontend-web/` (NUEVO) |
| No existía | `Frontend/shared/` (NUEVO) |
| Types duplicados | `@uniconnect/shared` (centralizado) |
| Services duplicados | `@uniconnect/shared` (centralizado) |

---

## Setup Inicial

### 1. Clonar el Repositorio

```bash
git clone <repo-url>
cd uniconnect
```

### 2. Instalar Dependencias del Monorepo

```bash
# Desde la raíz del repositorio
npm install --legacy-peer-deps
```

**¿Por qué `--legacy-peer-deps`?**  
Algunos paquetes de React Native tienen conflictos de peer dependencies. Este flag los resuelve sin romper la instalación.

### 3. Verificar Symlinks

```bash
ls -la node_modules/@uniconnect/shared
```

**Salida esperada**:
```
shared -> ../../Frontend/shared
```

Si el symlink no existe, ejecuta:
```bash
npm install --legacy-peer-deps
```

### 4. Configurar Variables de Entorno

**Backend** (`Backend/.env`):
```env
PORT=8007
DATABASE_URL="postgresql://..."
JWT_SECRET="uniconnect-secret"
AUTH0_DOMAIN="dev-xxx.auth0.com"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="uniconnect-files"
```

**Frontend-mobile** (`Frontend/Frontend-mobile/.env`):
```env
EXPO_PUBLIC_API_URL="http://localhost:8007/api"
EXPO_PUBLIC_AUTH0_DOMAIN="dev-xxx.auth0.com"
EXPO_PUBLIC_AUTH0_CLIENT_ID="xxx"
```

**Frontend-web** (`Frontend/Frontend-web/.env`):
```env
VITE_API_URL="http://localhost:8007/api"
VITE_WEBSOCKET_URL="http://localhost:8007"
VITE_AUTH0_DOMAIN="dev-xxx.auth0.com"
VITE_AUTH0_CLIENT_ID="xxx"
```

### 5. Verificar Instalación

```bash
# Verificar tipos en todo el monorepo
npm run typecheck:all

# Ejecutar tests de web
npm run test:web
```

**Salida esperada**:
```
✓ typecheck:shared - Exit Code 0
✓ typecheck:web - Exit Code 0
✓ test:web - 2/2 tests passing
```

---

## Flujo de Trabajo Diario

### Levantar el Entorno de Desarrollo

**Opción 1: Todo en terminales separadas**
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend Mobile
npm run dev:mobile

# Terminal 3: Frontend Web
npm run dev:web
```

**Opción 2: Solo lo que necesitas**
```bash
# Solo backend + web
npm run dev:backend  # Terminal 1
npm run dev:web      # Terminal 2
```

### Comandos Útiles

```bash
# Desarrollo
npm run dev:backend    # NestJS en localhost:8007
npm run dev:mobile     # Expo en localhost:8081
npm run dev:web        # Vite en localhost:5173

# Build
npm run build:shared   # Compila TypeScript del paquete compartido
npm run build:web      # Build de producción del frontend web

# Testing
npm run test:mobile    # Tests de Frontend-mobile (Jest)
npm run test:web       # Tests de Frontend-web (Vitest)
npm run test:all       # Todos los tests en secuencia

# Type Checking
npm run typecheck:shared   # Verifica tipos en shared
npm run typecheck:web      # Verifica tipos en Frontend-web
npm run typecheck:all      # Verifica todos los workspaces
```

---

## Trabajando con el Paquete Compartido

### ¿Qué hay en `@uniconnect/shared`?

1. **Types**: Interfaces TypeScript para todas las entidades (Event, User, Group, etc.)
2. **API Endpoints**: Constantes de rutas del backend
3. **Services**: Servicios HTTP con Dependency Injection (EventsService, GroupsService, etc.)
4. **Validators**: Esquemas Zod para validación de respuestas
5. **Utils**: Utilidades agnósticas de plataforma

### Importar desde `@uniconnect/shared`

#### 1. Importar Types

```typescript
// ✅ CORRECTO
import { Event, User, Group, FENResponse } from '@uniconnect/shared';

// ❌ INCORRECTO (no importar desde rutas relativas)
import { Event } from '../../../shared/src/types/events';
```

#### 2. Importar Endpoints

```typescript
// ✅ CORRECTO
import { EVENTS_ENDPOINTS, GROUPS_ENDPOINTS } from '@uniconnect/shared';

// Uso
const url = EVENTS_ENDPOINTS.GET_EVENTS; // '/events'
```

#### 3. Instanciar Services con Dependency Injection

```typescript
import { createApiClient, EventsService } from '@uniconnect/shared';

// Crear cliente API con AuthProvider
const api = createApiClient({
  baseURL: process.env.VITE_API_URL,
  authProvider: myAuthProvider,
  timeout: 10000,
});

// Instanciar servicio
const eventsService = new EventsService(api);

// Usar servicio (tokens manejados automáticamente)
const events = await eventsService.getEvents(filters, pagination);
```

#### 4. Validar con Zod

```typescript
import { validateFENResponse, EventArraySchema } from '@uniconnect/shared';

const response = await api.get('/events');
const validated = validateFENResponse(response.data, EventArraySchema);
```

### Agregar Código al Paquete Compartido

#### ¿Qué PUEDE ir en `shared/`?

✅ **PERMITIDO**:
- Types, interfaces, DTOs
- API endpoints (constantes de rutas)
- Services con dependency injection
- Validators (Zod schemas)
- Utilidades sin dependencias de plataforma

❌ **PROHIBIDO**:
- Componentes UI (específicos de plataforma)
- Hooks de React (específicos de plataforma)
- Stores (específicos de plataforma)
- Imports de `react-native`, `expo`, `react-dom`

#### Ejemplo: Agregar un Nuevo Type

```typescript
// Frontend/shared/src/types/my-entity.ts
export interface MyEntity {
  id: number;
  name: string;
  createdAt: string;
}

// Frontend/shared/src/types/index.ts
export * from './my-entity';
```

Ahora puedes importarlo:
```typescript
import { MyEntity } from '@uniconnect/shared';
```

---

## Migración de Código Existente

### Migrar Types

**Antes** (Frontend-mobile):
```typescript
// src/features/events/types/index.ts
export interface Event {
  id_event: number;
  title: string;
  // ...
}
```

**Después** (Shared):
```typescript
// Frontend/shared/src/types/events.ts
export interface Event {
  id_event: number;
  title: string;
  // ...
}

// Frontend-mobile: Re-exportar desde shared
import { Event } from '@uniconnect/shared';
export type { Event };
```

### Migrar Services

**Antes** (Frontend-mobile):
```typescript
// src/features/events/services/events.service.ts
export class EventsService {
  async getEvents() {
    const token = authStore.getToken(); // ❌ Acoplado a store
    const response = await api.get('/events', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}
```

**Después** (Shared con DI):
```typescript
// Frontend/shared/src/services/events.service.ts
export class EventsService {
  private readonly api: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance; // ✅ Dependency Injection
  }

  async getEvents(): Promise<FENResponse<Event[]>> {
    // Token manejado automáticamente por interceptores
    const response = await this.api.get(EVENTS_ENDPOINTS.GET_EVENTS);
    return this.validateFENResponse<Event[]>(response.data);
  }
}

// Frontend-mobile: Instanciar con DI
import { EventsService } from '@uniconnect/shared';
import { api } from '@/constants/api'; // Axios configurado

export const eventsService = new EventsService(api);
```

### Adaptar Componentes: React Native → React DOM

| React Native | React DOM |
|--------------|-----------|
| `<View>` | `<div>` |
| `<Text>` | `<p>`, `<span>`, `<h1-h6>` |
| `<TouchableOpacity>` | `<button>` |
| `<FlatList>` | `<ul>` + `map()` |
| `<Image>` | `<img>` |
| `<TextInput>` | `<input>`, `<textarea>` |
| `Alert.alert()` | `window.alert()` |
| `<Ionicons name="..." />` | Emojis Unicode o SVG |

**Ejemplo**:

**Antes** (Mobile):
```tsx
<TouchableOpacity onPress={handlePress}>
  <View style={styles.card}>
    <Text style={styles.title}>{event.title}</Text>
  </View>
</TouchableOpacity>
```

**Después** (Web):
```tsx
<div className={styles.card} onClick={handlePress}>
  <h3 className={styles.title}>{event.title}</h3>
</div>
```

---

## Troubleshooting

### Problema: Symlinks rotos

**Síntoma**:
```
Error: Cannot find module '@uniconnect/shared'
```

**Solución**:
```bash
# Desde la raíz
npm install --legacy-peer-deps
```

### Problema: Cambios en `shared` no se reflejan

**Síntoma**: Modificaste un archivo en `shared/` pero mobile/web no ven los cambios.

**Solución**:
```bash
# Opción 1: Compilar shared
npm run build:shared

# Opción 2: Reiniciar dev server
npm run dev:web  # o dev:mobile
```

### Problema: Errores de TypeScript en imports

**Síntoma**:
```
Cannot find module '@/features/...'
```

**Solución**: Verificar alias en `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Problema: Conflictos de peer dependencies

**Síntoma**:
```
npm error ERESOLVE unable to resolve dependency tree
```

**Solución**:
```bash
npm install --legacy-peer-deps
```

### Problema: Tests fallando después de migración

**Síntoma**: Tests que antes pasaban ahora fallan.

**Solución**:
1. Verificar imports: `@uniconnect/shared` en lugar de rutas relativas
2. Actualizar mocks si usaban servicios antiguos
3. Ejecutar `npm run typecheck:all` para detectar errores de tipos

---

## Preguntas Frecuentes

### ¿Puedo seguir trabajando solo en mobile?

Sí. El monorepo no te obliga a trabajar en web. Simplemente usa:
```bash
npm run dev:backend
npm run dev:mobile
```

### ¿Cómo agrego una dependencia a mobile/web?

```bash
# Para mobile
cd Frontend/Frontend-mobile
npm install <package>

# Para web
cd Frontend/Frontend-web
npm install <package>

# Reconstruir symlinks desde raíz
cd ../..
npm install --legacy-peer-deps
```

### ¿Cómo agrego una dependencia a shared?

```bash
cd Frontend/shared
npm install <package>

# Reconstruir symlinks desde raíz
cd ../..
npm install --legacy-peer-deps
```

### ¿Qué pasa si rompo algo en `shared`?

Los cambios en `shared` afectan a mobile y web. Por eso:
1. Ejecuta `npm run typecheck:all` antes de commitear
2. Ejecuta `npm run test:all` para validar
3. Si algo se rompe, TypeScript te avisará inmediatamente

### ¿Dónde pongo código nuevo?

- **Types, Services, Validators**: `Frontend/shared/`
- **Componentes Mobile**: `Frontend/Frontend-mobile/src/features/`
- **Componentes Web**: `Frontend/Frontend-web/src/features/`
- **Backend**: `Backend/src/`

---

## Recursos Adicionales

- **AGENTS.md**: Fuente de la verdad técnica con todas las reglas de arquitectura
- **README.md**: Documentación maestra del proyecto
- **Frontend/shared/README.md**: Documentación específica del paquete compartido

---

## Contacto y Soporte

Si tienes dudas sobre la migración:
1. Consulta `AGENTS.md` (sección "Arquitectura Monorepo")
2. Ejecuta `npm run typecheck:all` para detectar errores
3. Revisa esta guía en la sección de Troubleshooting

---

**Última actualización**: 6 de Mayo, 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Producción
