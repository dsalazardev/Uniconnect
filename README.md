# Uniconnect Monorepo

Monorepo multi-frontend para Uniconnect con código compartido entre React Native (mobile) y React (web).

## 📁 Estructura del Proyecto

```
uniconnect/
├── Backend/                 # NestJS Backend (PostgreSQL + Prisma)
├── Frontend-mobile/         # React Native + Expo (iOS/Android)
├── Frontend-web/            # React + Vite (Web)
├── shared/                  # Paquete compartido (@uniconnect/shared)
│   ├── src/
│   │   ├── types/          # Types compartidos
│   │   ├── api/            # Endpoints y Axios factory
│   │   ├── services/       # Services con DI
│   │   ├── validators/     # Zod validators
│   │   └── utils/          # Utilidades
└── package.json            # Workspace root
```

## 🚀 Instalación

### 1. Instalar dependencias del monorepo

```bash
npm install
```

Este comando instalará las dependencias de todos los workspaces (`shared`, `Frontend-mobile`, `Frontend-web`) y creará los enlaces simbólicos automáticamente.

### 2. Configurar variables de entorno

**Backend** (`Backend/.env`):
```env
PORT=8007
DATABASE_URL="postgresql://..."
JWT_SECRET="uniconnect-secret"
AUTH0_DOMAIN="dev-xxx.auth0.com"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="uniconnect-files"
```

**Frontend-mobile** (`Frontend-mobile/.env`):
```env
EXPO_PUBLIC_API_URL="http://localhost:8007/api"
EXPO_PUBLIC_AUTH0_DOMAIN="dev-xxx.auth0.com"
EXPO_PUBLIC_AUTH0_CLIENT_ID="xxx"
```

**Frontend-web** (`Frontend-web/.env`):
```env
VITE_API_URL="http://localhost:8007/api"
VITE_WEBSOCKET_URL="http://localhost:8007"
VITE_AUTH0_DOMAIN="dev-xxx.auth0.com"
VITE_AUTH0_CLIENT_ID="xxx"
```

## 🛠️ Comandos de Desarrollo

### Desarrollo

```bash
# Iniciar backend (NestJS)
npm run dev:backend

# Iniciar frontend mobile (Expo)
npm run dev:mobile

# Iniciar frontend web (Vite)
npm run dev:web
```

### Build

```bash
# Compilar paquete compartido
npm run build:shared

# Compilar frontend web
npm run build:web
```

### Testing

```bash
# Tests de frontend mobile
npm run test:mobile

# Tests de frontend web
npm run test:web

# Todos los tests
npm run test:all
```

### Type Checking

```bash
# Verificar tipos en shared
npm run typecheck:shared

# Verificar tipos en frontend web
npm run typecheck:web

# Verificar todos los tipos
npm run typecheck:all
```

## 📦 Paquete Compartido (@uniconnect/shared)

El paquete `shared` contiene código compartido entre mobile y web:

- **Types**: Interfaces TypeScript para todas las entidades
- **API Endpoints**: Constantes de rutas del backend
- **Axios Factory**: Factory con DI para crear instancias configuradas
- **Services**: Services con dependency injection (9 servicios)
- **Validators**: Esquemas Zod para validación de respuestas
- **Utils**: Utilidades agnósticas de plataforma

### Uso del paquete compartido

```typescript
// Importar types
import { Event, User, Group } from '@uniconnect/shared';

// Importar endpoints
import { EVENTS_ENDPOINTS } from '@uniconnect/shared';

// Importar services
import { EventsService } from '@uniconnect/shared';

// Instanciar service con DI
const eventsService = new EventsService(apiClient);
```

## 🏗️ Arquitectura

### Backend
- **Framework**: NestJS 11.x con TypeScript 5.7.x
- **Base de Datos**: PostgreSQL con Prisma ORM 7.4.x
- **Autenticación**: Passport JWT + Auth0
- **Storage**: AWS S3
- **WebSockets**: Socket.IO 4.8.x

### Frontend Mobile
- **Framework**: React Native 0.81.x con Expo 54.x
- **Navegación**: Expo Router 6.x
- **Estado**: MobX 6.x
- **HTTP Client**: Axios 1.13.x

### Frontend Web
- **Framework**: React 19.x con Vite 8.x
- **Navegación**: React Router 7.x
- **Estado**: MobX 6.x
- **HTTP Client**: Axios 1.13.x
- **Estilos**: CSS Modules

### Shared Package
- **TypeScript**: 5.7.x con strict mode
- **Validación**: Zod
- **Testing**: Jest + Fast-Check

## 📚 Documentación

Para más detalles sobre la arquitectura, reglas de negocio y patrones de diseño, consulta:

- `AGENTS.md` - Fuente de la verdad para desarrollo
- `Backend/README.md` - Documentación del backend
- `Frontend-mobile/README.md` - Documentación del mobile
- `Frontend-web/README.md` - Documentación del web

## 🧪 Testing

El proyecto utiliza:
- **Jest** para unit tests
- **Fast-Check** para property-based testing
- **React Testing Library** para component tests

## 🔒 Reglas de Desarrollo

1. **Zero-Any Policy**: Prohibido usar `any` en TypeScript
2. **Dependency Injection**: Services deben aceptar `AxiosInstance` en constructor
3. **Validación con Zod**: Usar esquemas de `shared/src/validators/`
4. **Clean Architecture**: Separación clara de capas (Domain, Infrastructure, Application)
5. **Programación Defensiva**: Try/catch en todas las operaciones async

## 📄 Licencia

MIT
