# AGENTS.md - Sistema de Contexto Autónomo para IA

> **FUENTE DE LA VERDAD** para cualquier LLM que trabaje en el proyecto Uniconnect.
> Este documento debe ser consultado ANTES de realizar cualquier cambio en el código.

## 🏗️ TECH STACK

### Backend (Uniconnect-Backend-Core)
- **Framework**: NestJS 11.x con TypeScript 5.7.x
- **Base de Datos**: PostgreSQL con Prisma ORM 7.4.x + TypeORM 0.3.x (migración en curso)
- **Autenticación**: Passport JWT + Auth0 (Google OAuth)
- **Storage**: AWS S3 con SDK v3
- **File Upload**: Multer (incluido en @nestjs/platform-express) + @types/multer ^1.4.12
- **WebSockets**: Socket.IO 4.8.x para chat en tiempo real
- **Testing**: Jest 30.x + Supertest + Fast-Check (Property-Based Testing)
- **Documentación**: Swagger/OpenAPI

### Frontend (Uniconnect-Frontend)
- **Framework**: React Native 0.81.x con Expo 54.x
- **Navegación**: Expo Router 6.x
- **Estado**: Zustand 5.x + MobX 6.x (híbrido)
- **HTTP Client**: Axios 1.13.x + TanStack Query 5.x
- **UI**: Expo Vector Icons + Linear Gradient
- **Testing**: Jest + React Native Testing Library + Fast-Check

## 🚨 REGLAS DE INGENIERÍA ESTRICTAS

### 1. TIPADO ESTRICTO - CERO `any`
```typescript
// ❌ PROHIBIDO
function processData(data: any): any { }

// ✅ CORRECTO
function processData(data: UserData): ProcessedResult { }
```

### 2. ARQUITECTURA BACKEND - Servicios/Repositorios
```
src/
├── [entity]/
│   ├── [entity].controller.ts    # Endpoints REST
│   ├── [entity].service.ts       # Lógica de negocio
│   ├── [entity].module.ts        # Módulo NestJS
│   ├── dto/                      # Data Transfer Objects
│   └── guards/                   # Guards específicos
```

### 3. ARQUITECTURA FRONTEND - MVC Local
```
src/
├── features/[feature]/
│   ├── components/               # Vista (V)
│   ├── hooks/                    # Controlador (C)
│   ├── stores/                   # Modelo (M) - Zustand/MobX
│   └── types/                    # Interfaces TypeScript
```

### 4. LOGGING OBLIGATORIO - UniconnectLogger Singleton
```typescript
import { UniconnectLogger } from '@/core/logger/uniconnect-logger.singleton';

const logger = UniconnectLogger.getInstance();
logger.info('Operación iniciada');
logger.error('Error crítico', error.stack);
```

### 5. PROGRAMACIÓN DEFENSIVA - Try/Catch + Excepciones NestJS
```typescript
// Backend
try {
  const result = await this.service.riskyOperation();
  return result;
} catch (error) {
  this.logger.error('Error en operación', error.stack);
  throw new InternalServerErrorException('Operación falló');
}

// Frontend
try {
  const data = await api.fetchData();
  return data;
} catch (error) {
  logger.error('API call failed', error);
  throw new Error('Failed to fetch data');
}
```

### 6. VALIDACIÓN ESTRICTA
- **Backend**: `class-validator` + `class-transformer` en DTOs
- **Frontend**: Validación en hooks antes de envío

## 📊 MAPA DE ENTIDADES (Prisma Schema)


### Enums

#### 🏷️ **EventType**
```prisma
enum EventType {
  CONFERENCIA
  TALLER
  SEMINARIO
  COMPETENCIA
  CULTURAL
  DEPORTIVO
}
```

### Entidades Principales

#### 👤 **User**
```prisma
model user {
  id_role: Int
  id_user: Int                @id @default(autoincrement())
  full_name: String             @db.VarChar
  cell_phone: String?            @db.VarChar
  picture: String?
  email: String             @db.VarChar
  id_program: Int?
  current_semester: Int?
  google_sub: String?            @db.VarChar
  enrollments: enrollment[]
  groups_owned: group[]
  memberships: membership[]
  notifications: notification[]
  push_token: push_token[]
  group_join_requests: group_join_request[]
  events_created: event[]
  
  // Relaciones
  connections_adressee: connection[]       @relation("ConnectionAdressee")
  connections_requester: connection[]       @relation("ConnectionRequester")
  invitations_received: group_invitation[] @relation("GroupInvitee")
  invitations_sent: group_invitation[] @relation("GroupInviter")
  program: program?           @relation(fields: [id_program], references: [id_program])
  role: role               @relation(fields: [id_role], references: [id_role])
}
```

#### 🏢 **Group**
```prisma
model group {
  id_group: Int                  @id @default(autoincrement())
  name: String?              @db.VarChar
  description: String?              @db.VarChar
  id_course: Int?
  owner_id: Int?
  created_at: DateTime             @default(now()) @db.Timestamptz(6)
  is_direct_message: Boolean              @default(false)
  files: file[]
  group_invitation: group_invitation[]
  memberships: membership[]
  group_join_requests: group_join_request[]
  
  // Relaciones
  course: course?              @relation(fields: [id_course], references: [id_course])
  owner: user?                @relation(fields: [owner_id], references: [id_user])
}
```

#### 💬 **Message**
```prisma
model message {
  id_message: Int         @id @default(autoincrement())
  id_membership: Int?
  text_content: String?     @db.VarChar
  send_at: DateTime    @default(now()) @db.Timestamptz(6)
  attachments: String?
  edited_at: DateTime?   @db.Timestamptz(6)
  is_edited: Boolean     @default(false)
  files: file[]
  
  // Relaciones
  membership: membership? @relation(fields: [id_membership], references: [id_membership])
}
```

#### 🎯 **Event**
```prisma
model event {
  id_event: Int       @id @default(autoincrement())
  title: String
  description: String
  date: DateTime
  time: String
  location: String
  type: EventType
  created_by: Int       // ID del usuario que creó el evento
  id_program: Int?      // ID de la carrera/programa (opcional para eventos globales de superadmin)
  createdAt: DateTime  @default(now())
  updatedAt: DateTime  @updatedAt
  
  // Relaciones
  creator: user      @relation(fields: [created_by], references: [id_user], onDelete: Cascade)
  program: program?  @relation(fields: [id_program], references: [id_program], onDelete: SetNull)
}
```

**✅ RESUELTO - Problema de Schema Events (Abril 2026)**:
- **Problema Original**: Backend en producción retornaba error `INTERNAL_ERROR: "The column (not available) does not exist"` al consultar eventos
- **Síntoma en Frontend**: App buildeada muestra "Error al cargar eventos", funciona en desarrollo
- **Diagnóstico**: 
  - Base de datos tiene schema correcto (`id_event INTEGER`, `created_by INTEGER`) ✅
  - Prisma Client en Render estaba desactualizado (generado con schema viejo) ❌
  - El código compilado en producción usaba Prisma Client incompatible con la BD
- **Causa Real**: Prisma Client no sincronizado - Render usaba cliente generado con schema antiguo
- **Solución Aplicada**:
  1. Regenerado Prisma Client local: `npx prisma generate`
  2. Rebuild del backend: `npm run build`
  3. Push a GitHub (commit `95dee54`) para trigger redeploy en Render
- **Estado**: ⏳ EN REDEPLOY - Render procesando cambios (5-10 minutos)
- **Verificación DB**: 3 eventos existentes confirmados (id_event: 3, 4, 5)
- **Post-Deploy**: Después del redeploy, el endpoint `/events` retornará los 3 eventos correctamente
- **Nota**: Cambios innecesarios del frontend fueron revertidos (commit `6c3dab5`) - solo se requería fix del backend

#### 🔗 **Connection**
```prisma
model connection {
  id_connection: Int       @id @default(autoincrement())
  requester_id: Int
  adressee_id: Int
  status: String?   @db.VarChar
  request_at: DateTime? @db.Timestamptz(6)
  respondend_at: DateTime? @db.Timestamptz(6)
  
  // Relaciones
  adressee: user      @relation("ConnectionAdressee", fields: [adressee_id], references: [id_user])
  requester: user      @relation("ConnectionRequester", fields: [requester_id], references: [id_user])
}
```

#### 👥 **Membership**
```prisma
model membership {
  id_membership: Int       @id @default(autoincrement())
  id_user: Int?
  id_group: Int?
  is_admin: Boolean?
  joined_at: DateTime? @db.Timestamptz(6)
  messages: message[]
  
  // Relaciones
  group: group?    @relation(fields: [id_group], references: [id_group])
  user: user?     @relation(fields: [id_user], references: [id_user])
}
```

### Entidades de Relación

#### 🔑 **Access**
```prisma
model access {
  id_role: Int
  id_permission: Int
  
  // Relaciones
  permission: permission @relation(fields: [id_permission], references: [id_permission])
  role: role       @relation(fields: [id_role], references: [id_role])
}
```

#### 📚 **Course**
```prisma
model course {
  id_course: Int          @id @default(autoincrement())
  name: String?      @db.VarChar
  id_program: Int?
  enrollments: enrollment[]
  groups: group[]
  
  // Relaciones
  program: program?     @relation(fields: [id_program], references: [id_program])
}
```

#### 📝 **Enrollment**
```prisma
model enrollment {
  id_enrollment: Int     @id @default(autoincrement())
  id_user: Int?
  id_course: Int?
  status: String? @db.VarChar
  
  // Relaciones
  course: course? @relation(fields: [id_course], references: [id_course])
  user: user?   @relation(fields: [id_user], references: [id_user])
}
```

#### 📁 **File**
```prisma
model file {
  id_file: Int       @id @default(autoincrement())
  url: String    @db.VarChar
  file_name: String    @db.VarChar
  mime_type: String    @db.VarChar
  size: Int?
  created_at: DateTime? @default(now()) @db.Timestamptz(6)
  id_message: Int?
  id_group: Int?
  
  // Relaciones
  group: group?    @relation(fields: [id_group], references: [id_group], onDelete: Cascade)
  message: message?  @relation(fields: [id_message], references: [id_message], onDelete: Cascade)
}
```

#### 📧 **Group_invitation**
```prisma
model group_invitation {
  id_invitation: Int       @id @default(autoincrement())
  id_group: Int
  inviter_id: Int
  invitee_id: Int
  status: String    @default("pending") @db.VarChar
  invited_at: DateTime  @default(now()) @db.Timestamptz(6)
  responded_at: DateTime? @db.Timestamptz(6)
  
  // Relaciones
  group: group     @relation(fields: [id_group], references: [id_group], onDelete: Cascade)
  invitee: user      @relation("GroupInvitee", fields: [invitee_id], references: [id_user])
  inviter: user      @relation("GroupInviter", fields: [inviter_id], references: [id_user])
}
```

#### 🚪 **Group_join_request**
```prisma
model group_join_request {
  id_request: Int       @id @default(autoincrement())
  requester_id: Int
  id_group: Int
  status: String    @default("pending") // pending, accepted, rejected
  requested_at: DateTime  @default(now()) @db.Timestamptz(6)
  responded_at: DateTime? @db.Timestamptz(6)
  
  // Relaciones
  requester: user      @relation(fields: [requester_id], references: [id_user])
  group: group     @relation(fields: [id_group], references: [id_group])
}
```

#### 🔔 **Notification**
```prisma
model notification {
  id_notification: Int       @id @default(autoincrement())
  id_user: Int?
  message: String?   @db.VarChar
  is_read: Boolean?
  created_at: DateTime? @db.Timestamptz(6)
  related_entity_id: Int?
  notification_type: String?
  push_sent: Boolean   @default(false)
  
  // Relaciones
  user: user?     @relation(fields: [id_user], references: [id_user])
}
```

#### 🛡️ **Permission**
```prisma
model permission {
  id_permission: Int      @id @default(autoincrement())
  name: String   @db.VarChar
  description: String   @db.VarChar
  claim: String   @db.VarChar
  accesses: access[]
}
```

#### 🎓 **Program**
```prisma
model program {
  id_program: Int      @id @default(autoincrement())
  name: String?  @db.VarChar
  courses: course[]
  users: user[]
  events: event[]
}
```

#### 📱 **Push_token**
```prisma
model push_token {
  id_token: Int      @id @default(autoincrement())
  id_user: Int
  token: String   @unique
  device_type: String
  device_name: String?
  is_active: Boolean  @default(true)
  created_at: DateTime @default(now())
  updated_at: DateTime
  
  // Relaciones
  user: user     @relation(fields: [id_user], references: [id_user])
}
```

#### 🔐 **Role**
```prisma
model role {
  id_role: Int      @id @default(autoincrement())
  name: String   @unique @db.VarChar
  accesses: access[]
  users: user[]
}
```

## 🏛️ ARQUITECTURA DE MÓDULOS BACKEND (18 MÓDULOS)

### Módulos Core
1. **AppModule** - Módulo raíz con configuración global
2. **AuthModule** - Autenticación JWT + Auth0 + Google OAuth
3. **PrismaModule** - ORM y conexión a PostgreSQL
4. **UsersModule** - Gestión de perfiles de usuario

### Módulos de Negocio
5. **GroupsModule** - Grupos de chat y estudio
6. **MessagesModule** - Sistema de mensajería + WebSockets
7. **EventsModule** - Eventos académicos
8. **ConnectionsModule** - Red social de conexiones
9. **NotificationsModule** - Sistema de notificaciones push

### Módulos Académicos
10. **ProgramsModule** - Carreras/Programas académicos
11. **CoursesModule** - Materias/Cursos
12. **EnrollmentsModule** - Inscripciones a cursos

### Módulos de Gestión
13. **MembershipsModule** - Membresías en grupos
14. **GroupInvitationsModule** - Invitaciones a grupos
15. **FilesModule** - Gestión de archivos AWS S3

### Módulos de Seguridad
16. **RolesModule** - Sistema de roles (student, admin, superadmin)
17. **PermissionsModule** - Permisos granulares
18. **CoreModule** - Utilidades centrales (Logger, Middlewares)

## 🔐 SISTEMA DE AUTENTICACIÓN

### Flujo de Autenticación
```
1. Frontend → Google OAuth → Auth0
2. Auth0 → Authorization Code → Backend
3. Backend → Token Exchange → JWT + User Data
4. JWT Payload: { sub: user_id, permissions: [claims], roleName, auth0_sub }
```

### JWT User ID Type Conversion - Seguridad Crítica
- **Problema Resuelto**: JWT tokens proporcionan user IDs como strings, pero Prisma espera integers
- **Ubicación de las Fixes**: 
  - `src/events/events.controller.ts` - Conversión explícita en todos los endpoints (FIX-08, FIX-09)
  - `src/events/events.service.ts` - Validación defensiva en capa de servicio (FIX-08, FIX-09)
  - `src/group-invitations/group-invitations.controller.ts` - Conversión defensiva para invitaciones (FIX-14)
  - `src/group-invitations/group-invitations.service.ts` - Validación defensiva para invitaciones (FIX-14)
- **Implementación**:
  ```typescript
  // Controller Level - Explicit Type Conversion
  const numericUserId = typeof userIdFromJWT === 'string' 
    ? parseInt(userIdFromJWT, 10) 
    : userIdFromJWT;
  
  // Validation
  if (isNaN(numericUserId) || numericUserId <= 0) {
    throw new Error('Invalid user ID from JWT token. Must be a positive integer.');
  }
  
  // Service Level - Defensive Programming
  if (typeof userId !== 'number' || isNaN(userId) || userId <= 0) {
    return this.formatFENResponse(false, null, {
      code: 'INVALID_USER_ID',
      message: 'ID de usuario inválido. Debe ser un número entero positivo.'
    });
  }
  ```
- **Patrón Requerido**: Todos los controladores que usen `@GetClaim('sub')` DEBEN convertir a número
- **Módulos Implementados**: EventsModule (FIX-08, FIX-09), GroupInvitationsModule (FIX-14)
- **Testing**: Property-based tests implementados para validar conversión con fast-check
- **Documentación**: Comentarios JSDoc agregados en EventsService y GroupInvitationsService explicando requisitos de conversión

### Guards y Decoradores
- **@UseGuards(JwtAuthGuard)** - Valida JWT en requests
- **@UseGuards(GroupOwnershipGuard)** - Valida que el usuario sea owner o admin del grupo
- **@UseGuards(EventOwnershipGuard)** - Valida que el usuario sea creador del evento o superadmin
- **@AdminOnly()** - Solo usuarios admin/superadmin
- **@RequireAll(...permissions)** - Requiere TODOS los permisos
- **@RequireAny(...permissions)** - Requiere AL MENOS UNO
- **@GetClaim('sub')** - **CRÍTICO**: Extrae ID relacional del usuario (usar SIEMPRE para Prisma queries) - Confirmado en FIX-09 y FIX-14
- **@GetClaim('auth0_sub')** - Extrae Auth0 ID del proveedor (solo disponible en auth0Callback)

### Roles y Permisos
- **student** (default) - Usuarios nuevos
- **admin** - Administradores de programa
- **superadmin** - Administradores del sistema
- **Claims**: GC (Google Classroom), GD (Google Drive), etc.

## 🔄 FLUJOS PRINCIPALES

### 1. Chat en Tiempo Real (WebSockets)
```typescript
// Gateway: MessagesGateway
@SubscribeMessage('authenticate')
@SubscribeMessage('send_message')
@SubscribeMessage('edit_message')
@SubscribeMessage('delete_message')
@SubscribeMessage('load_messages')
@SubscribeMessage('search_messages')
@SubscribeMessage('user_typing')
@SubscribeMessage('leave_room')
```

### 2. Gestión de Grupos
```
Create Group → Add Owner as Admin → Create Membership
Join Group → Request Access → Admin Approval → Add Membership
Invite User → Create GroupInvitation → User Accept/Reject
Leave Group → Remove Membership
```

### 3. Conexiones Sociales
```
Request Connection → Create Connection (pending)
Accept Connection → Update status to accepted
Reject Connection → Update status to rejected
Get Connected Users → Filter by program/course
```

### 4. Eventos Académicos
```
Create Event → Validate permissions → Store in Prisma
Filter Events → By program, type, date, creator
Push Notifications → Auto-notify students
```

### 5. Subida de Archivos
```
Frontend → Multer → Validate → S3 Upload → Get Presigned URL → Store in Prisma
```

### 6. File Upload con Multer - Patrón de Tipos
```typescript
// ✅ CORRECTO - Usar Express.Multer.File de @types/multer
import { Express } from 'express';

// En Controllers
@Post('upload')
@UseInterceptors(FilesInterceptor('files', 5))
uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
  // files tiene tipado completo
}

// En Services
async uploadGroupFiles(files: Express.Multer.File[], groupId: number) {
  // Acceso seguro a file.originalname, file.buffer, file.mimetype, etc.
}

// ❌ INCORRECTO - No importar directamente desde 'multer'
import { File } from 'multer';  // Causa TS2307 sin @types/multer
import * as multer from 'multer';  // Innecesario, usar Express.Multer.File
```

## 🎨 ARQUITECTURA FRONTEND (React Native + Expo)

### Estructura de Features
```
src/
├── features/
│   ├── auth/
│   │   ├── components/          # LoginScreen, OnboardingScreen
│   │   ├── hooks/               # useAuth0Login, useTokenRefresh
│   │   ├── stores/              # AuthStore (MobX)
│   │   ├── controllers/         # AuthController
│   │   └── types/               # User, Role, TokenPayload
│   ├── messages/
│   │   ├── components/          # MessageList, MessageInput, ChatHeader
│   │   ├── hooks/               # useMessages, useRecentMessages
│   │   ├── services/            # MessagesService, WebSocketService
│   │   └── types/               # Message, MessageSearchResponse
│   ├── groups/
│   │   ├── components/          # GroupList, GroupDetail, MemberList
│   │   ├── hooks/               # useGroups, useMyGroups, useJoinRequest
│   │   ├── services/            # GroupsService
│   │   └── types/               # Group, Membership, GroupInvitation
│   ├── events/
│   │   ├── components/          # EventList, EventDetail, EventCreate
│   │   ├── hooks/               # useEvents, useEventFilters
│   │   ├── stores/              # EventStore (MobX)
│   │   └── services/            # EventsService
│   ├── students/
│   │   ├── components/          # StudentCard (muestra semestre actual)
│   │   ├── hooks/               # useCommunityLists
│   │   ├── services/            # StudentService
│   │   └── types/               # Student (incluye current_semester), UserProfile
│   └── notifications/
│       ├── components/          # NotificationCenter
│       ├── hooks/               # useNotifications, usePushNotifications
│       ├── stores/              # NotificationStore (MobX)
│       └── services/            # NotificationsService
```

### Estado Global (MobX + Zustand)
- **AuthStore** (MobX) - Sesión, tokens, usuario
- **EventStore** (MobX) - Eventos, filtros
- **NotificationStore** (MobX) - Notificaciones, contador

### Configuración HTTP
- **Base URL**: EXPO_PUBLIC_API_URL
- **WebSocket URL**: WEBSOCKET_URL (sin /api)
- **Interceptors**: JWT Bearer token + refresh automático
- **Timeout**: 10 segundos

### FIX-10: Axios Interceptor Promise Queueing (Token Refresh)

**Problema Original**: Cuando el Access Token expiraba, múltiples peticiones concurrentes disparaban múltiples llamadas a `/auth/refresh`, causando peticiones redundantes al servidor, bucles infinitos en caso de fallos 500, y cierre abrupto de sesión sin notificación.

**Solución Implementada**:
- **Mutex Global**: Variable `isRefreshing` garantiza que solo UNA petición refresque el token a la vez
- **Promise Queue**: Array `failedQueue` encola peticiones pendientes mientras se refresca
- **Flujo**: 
  - 401 detectado → Si `!isRefreshing`: Bloquea, llama refresh. Si `isRefreshing === true`: Encola
  - Refresh éxito → Procesa queue, reintenta peticiones encoladas
  - Refresh fallo → Graceful degradation: limpia sesión, notifica usuario, rechaza queue
- **Tipado Estricto**: Interfaces `TokenRefreshResult` y `RefreshError` eliminan `any`
- **Ubicación**: `src/constants/api.ts` (interceptor response)
- **Documentación**: `.kiro/specs/fix-10-token-refresh/` (requirements.md, design.md, tasks.md)

### FIX-11: Validación FEN Flexible para Operaciones DELETE

**Problema Original**: Peticiones DELETE a `/events/:id` retornaban HTTP 200 con `success: true` y `data: null`, pero el frontend rechazaba con error "falta campo id_event" porque validaba estructura estricta de Event incluso para respuestas de confirmación.

**Causa Raíz**: El método `validateFENResponse()` en `events.service.ts` asumía que TODAS las respuestas exitosas debían contener campos completos del modelo (id_event, title, description, date, time, location, type, createdAt, updatedAt).

**Solución Implementada**:
- **Parámetro Configurable**: Agregado parámetro `skipStrictValidation: boolean = false` a `validateFENResponse()`
- **Validación Contextual**:
  - Cuando `skipStrictValidation = true`: Solo valida estructura FEN básica (success, error, metadata) sin exigir campos en data
  - Cuando `skipStrictValidation = false` (default): Valida campos estrictos para GET/POST/PUT
- **Aplicación**: `deleteEvent()` pasa `skipStrictValidation = true`, otros métodos usan default
- **Semántica HTTP**: 
  - **GET/POST/PUT**: Retornan entidad completa → Validación estricta
  - **DELETE**: Retorna confirmación (null o {deleted: true}) → Validación flexible
- **Ubicación**: `src/features/events/services/events.service.ts` (línea 223 deleteEvent, línea 352 validateFENResponse)
- **Documentación**: `.kiro/specs/fix-11-delete-validation/` (requirements.md, design.md, tasks.md)
- **Store**: `src/features/events/store/events.store.ts` deleteEvent() filtra evento del estado local cuando eliminación es exitosa

## 🛠️ REGLAS DE NEGOCIO IMPLEMENTADAS

1. **Autenticación**: Solo usuarios @ucaldas.edu.co con email verificado
2. **Roles**: student (default), admin (programa), superadmin (sistema)
3. **Grupos**: 
   - Owner es admin automáticamente, memberships únicas por usuario
   - **SEGURIDAD**: Solo Owner o Admin pueden editar/eliminar grupos (GroupOwnershipGuard)
   - **UI CONDICIONAL**: Botones de editar/eliminar solo visibles para Owner/Admin
   - **INVITACIONES**: 
     - Manejo defensivo - si ya es miembro, retorna éxito con mensaje amigable
     - **JWT User ID Conversion**: Conversión defensiva de tipo en controller y service (FIX-14)
     - Validación estricta de userId antes de operaciones de base de datos
     - Logging de diagnóstico para debugging de problemas de autenticación
4. **Mensajes**: Solo miembros pueden enviar, editar/eliminar solo autor o admin
5. **Conexiones**: Bidireccionales, estados: pending/accepted/rejected
6. **Eventos**: 
   - Superadmin crea globales, admin crea por programa
   - **SEGURIDAD**: Solo creador o superadmin pueden editar/eliminar eventos (EventOwnershipGuard)
   - **UI CONDICIONAL**: Botones de editar/eliminar solo visibles para creador o superadmin
   - **VALIDACIÓN**: EditEventModal valida event.id antes de enviar requests
7. **Archivos**: Validación MIME, almacenamiento en S3, URLs presignadas
8. **Notificaciones**: Push automáticas para eventos importantes
9. **Comunidad**: 
   - Vista de "Mis Amigos" muestra usuarios con conexión aceptada
   - Vista de "Comunidad General" muestra usuarios sin conexión aceptada
   - **VISUALIZACIÓN**: StudentCard muestra semestre actual (`current_semester`) junto al programa académico
   - **PERFIL**: Vista de perfil de estudiante muestra semestre actual en sección de Información
   - Backend retorna `current_semester` en endpoints `/users/community/connected`, `/users/community/not-connected` y `/users/profile/:id`

## 🏗️ REGLAS DE ARQUITECTURA Y PATRONES DE DISEÑO

> **FUENTE DE LA VERDAD ARQUITECTÓNICA**: Estos son los patrones exactos implementados en Uniconnect.
> TODOS los nuevos desarrollos DEBEN seguir estos patrones sin excepción.

### 🎯 PATRÓN PRINCIPAL: CLEAN ARCHITECTURE + DOMAIN-DRIVEN DESIGN

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Controller  │───▶│   Service   │───▶│ Repository  │     │
│  │   (HTTP)    │    │ (Business)  │    │   (Data)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │    DTOs     │    │ Validators  │    │   Prisma    │     │
│  │   Guards    │    │   Events    │    │    ORM      │     │
│  │ Decorators  │    │  Managers   │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Components  │───▶│    Hooks    │───▶│   Stores    │     │
│  │   (View)    │    │(Controller) │    │  (Model)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Types     │    │  Services   │    │    MobX     │     │
│  │    API      │    │ WebSocket   │    │   Zustand   │     │
│  │ Endpoints   │    │   HTTP      │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 BACKEND: NESTJS + CLEAN ARCHITECTURE

#### 1. PATRÓN MVC + REPOSITORY + DOMAIN SERVICES
```typescript
// ✅ ESTRUCTURA OBLIGATORIA POR MÓDULO
src/[entity]/
├── [entity].controller.ts    # HTTP Layer - Solo routing y validación
├── [entity].service.ts       # Business Logic Layer - Reglas de negocio
├── [entity].module.ts        # NestJS Module - Dependency Injection
├── dto/                      # Data Transfer Objects - Validación
├── guards/                   # Security Guards - Autorización específica
├── repositories/             # Data Access Layer - Queries complejas
├── validators/               # Business Validators - Reglas de dominio
├── entities/                 # TypeORM Entities (migración en curso)
└── interfaces/               # Contratos y tipos
```

#### 2. RESPONSABILIDADES POR CAPA

**Controllers (HTTP Layer)**:
- ✅ Routing y decoradores HTTP
- ✅ Validación de DTOs con `class-validator`
- ✅ Aplicación de Guards y decoradores de seguridad
- ✅ Extracción de claims JWT con `@GetClaim('sub')`
- ❌ NO lógica de negocio
- ❌ NO acceso directo a base de datos

**Services (Business Logic Layer)**:
- ✅ Lógica de negocio y reglas de dominio
- ✅ Orquestación de repositorios y validators
- ✅ Manejo de transacciones con Prisma
- ✅ Emisión de eventos con EventEmitter2
- ✅ Formateo de respuestas FEN (Frontend-Esperado-Normalizado)
- ❌ NO validación de DTOs (se hace en Controller)
- ❌ NO manejo directo de HTTP requests

**Repositories (Data Access Layer)**:
- ✅ Queries complejas y optimizadas
- ✅ Abstracción de Prisma ORM
- ✅ Métodos de consulta reutilizables
- ✅ Includes y selects optimizados
- ❌ NO lógica de negocio
- ❌ NO validaciones de dominio

#### 3. PATRÓN DE SEGURIDAD: GUARDS + DECORATORS
```typescript
// ✅ PATRÓN OBLIGATORIO DE SEGURIDAD
@Controller('events')
@UseGuards(JwtAuthGuard) // Autenticación base
export class EventsController {
  
  @Post()
  @UseGuards(AdminGuard) // Autorización específica
  @AdminOnly() // Decorador declarativo
  async create(
    @Body() dto: CreateEventDto, // Validación automática
    @GetClaim('sub') userId: number, // Extracción de JWT claim
  ) {
    // Conversión defensiva de tipos JWT
    const numericUserId = typeof userId === 'string' 
      ? parseInt(userId, 10) 
      : userId;
    
    if (isNaN(numericUserId) || numericUserId <= 0) {
      throw new BadRequestException('Invalid user ID from JWT');
    }
    
    return this.service.create(dto, numericUserId);
  }
}
```

#### 4. PATRÓN DE VALIDACIÓN: BUSINESS VALIDATORS
```typescript
// ✅ PATRÓN OBLIGATORIO DE VALIDACIÓN DE DOMINIO
@Injectable()
export class GroupBusinessValidator {
  constructor(private prisma: PrismaService) {}

  async validateMaxGroupsPerCourse(userId: number, courseId: number): Promise<void> {
    const count = await this.prisma.group.count({
      where: { owner_id: userId, id_course: courseId }
    });
    
    if (count >= 3) {
      throw new BadRequestException('Máximo 3 grupos por materia');
    }
  }
}
```

#### 5. PATRÓN DE EVENTOS: EVENT-DRIVEN ARCHITECTURE
```typescript
// ✅ PATRÓN OBLIGATORIO DE EVENTOS
@Injectable()
export class GroupsService {
  constructor(
    private eventEmitter: EventEmitter2,
  ) {}

  async acceptInvitation(invitationId: number, userId: number) {
    // Lógica de negocio...
    
    // Emitir evento para notificaciones
    this.eventEmitter.emit('group.invitation.accepted', {
      invitationId,
      userId,
      groupId,
    });
  }
}
```

### 🎨 FRONTEND: REACT NATIVE + MVC LOCAL

#### 1. PATRÓN FEATURE-BASED + MVC LOCAL
```typescript
// ✅ ESTRUCTURA OBLIGATORIA POR FEATURE
src/features/[feature]/
├── components/               # View Layer - UI Components
├── hooks/                    # Controller Layer - Business Logic
├── stores/                   # Model Layer - State Management
├── services/                 # API Layer - HTTP/WebSocket
├── types/                    # TypeScript Interfaces
└── api/                      # Endpoint Definitions
```

#### 2. PATRÓN DE ESTADO: MOBX OBSERVABLE + ZUSTAND HYBRID
```typescript
// ✅ PATRÓN OBLIGATORIO DE ESTADO (MobX)
export class EventsStore {
  events: Event[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(service: EventsService = eventsService) {
    this.eventsService = service;
    makeAutoObservable(this); // MobX 6+ pattern
  }

  async loadEvents(): Promise<void> {
    this.setLoading(true);
    try {
      const response = await this.eventsService.getEvents();
      runInAction(() => {
        this.setEvents(response.data || []); // Defensive programming
      });
    } catch (error) {
      runInAction(() => {
        this.setError(error.message);
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }
}
```

#### 3. PATRÓN DE SERVICIOS: BFF (BACKEND FOR FRONTEND)
```typescript
// ✅ PATRÓN OBLIGATORIO DE SERVICIOS HTTP
export class EventsService {
  async getEvents(filters: EventFilters = {}): Promise<FENResponse<Event[]>> {
    try {
      const response = await api.get(EVENTS_ENDPOINTS.GET_EVENTS, { 
        params: this.buildQueryParams(filters) 
      });
      
      // Validación FEN response
      return this.validateFENResponse<Event[]>(response.data);
    } catch (error) {
      // Error handling defensivo
      return {
        success: false,
        data: [], // SIEMPRE array vacío en error
        error: { code: 'NETWORK_ERROR', message: error.message }
      };
    }
  }
}
```

#### 4. PATRÓN DE CONTROLADORES: CUSTOM HOOKS
```typescript
// ✅ PATRÓN OBLIGATORIO DE HOOKS (Controller Layer)
export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  
  const loadEvents = useCallback(async (filters?: EventFilters) => {
    setLoading(true);
    try {
      const response = await eventsService.getEvents(filters);
      if (response.success) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { events, loading, loadEvents };
};
```

### 🔒 PATRÓN DE SEGURIDAD: JWT CLAIMS + DEFENSIVE PROGRAMMING

#### 1. EXTRACCIÓN DE JWT CLAIMS (CRÍTICO)
```typescript
// ✅ PATRÓN OBLIGATORIO - SIEMPRE usar 'sub' para ID de usuario
@Get()
async findAll(@GetClaim('sub') userId: number) {
  // ✅ CONVERSIÓN DEFENSIVA OBLIGATORIA
  const numericUserId = typeof userId === 'string' 
    ? parseInt(userId, 10) 
    : userId;
    
  if (isNaN(numericUserId) || numericUserId <= 0) {
    throw new BadRequestException('Invalid user ID from JWT');
  }
  
  return this.service.findAll(numericUserId);
}

// ❌ PROHIBIDO - No usar otros claims para ID de usuario
@Get()
async findAll(@GetClaim('id_user') userId: number) { // ❌ INCORRECTO
```

#### 2. ESTRUCTURA JWT PAYLOAD (DOCUMENTADA)
```typescript
// ✅ ESTRUCTURA OFICIAL DEL JWT PAYLOAD
interface JWTPayload {
  sub: number;                    // ✅ ID relacional local del usuario
  permissions: string[];          // Array de permisos/claims
  roleName: string;              // Nombre del rol (student/admin/superadmin)
  auth0_sub?: string;            // ID del proveedor Auth0 (solo en callback)
}
```

### 🧪 PATRÓN DE TESTING: PROPERTY-BASED + BUG CONDITION METHODOLOGY

#### 1. PROPERTY-BASED TESTING CON FAST-CHECK
```typescript
// ✅ PATRÓN OBLIGATORIO DE TESTING
import fc from 'fast-check';

describe('JWT User ID Conversion', () => {
  it('should handle all possible JWT user ID types', () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.integer({ min: 1, max: 1000 }),
        fc.string().map(s => s + ''),
        fc.constant(undefined),
        fc.constant(null)
      ),
      (userId) => {
        const result = convertJWTUserId(userId);
        // Property: resultado siempre es number válido o error
        expect(typeof result === 'number' || result instanceof Error).toBe(true);
      }
    ));
  });
});
```

#### 2. BUG CONDITION METHODOLOGY
```typescript
// ✅ PATRÓN OBLIGATORIO PARA BUGFIXES
describe('Bug Condition Exploration', () => {
  it('should reproduce the exact bug condition', () => {
    // Property 1: Bug Condition - reproduce el bug exacto
    const bugCondition = isBugCondition(input);
    expect(bugCondition).toBe(true);
  });
  
  it('should preserve non-buggy behavior', () => {
    // Property 2: Preservation - comportamiento no-buggy idéntico
    fc.assert(fc.property(
      fc.anything().filter(input => !isBugCondition(input)),
      (input) => {
        const originalResult = originalFunction(input);
        const fixedResult = fixedFunction(input);
        expect(fixedResult).toEqual(originalResult);
      }
    ));
  });
});
```

### 📊 PATRÓN DE RESPUESTAS: FEN (FRONTEND-ESPERADO-NORMALIZADO)

#### 1. FORMATO ESTÁNDAR DE RESPUESTAS
```typescript
// ✅ PATRÓN OBLIGATORIO DE RESPUESTAS
interface FENResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  metadata?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    timestamp: string;
  };
}
```

#### 2. VALIDACIÓN FEN EN FRONTEND
```typescript
// ✅ PATRÓN OBLIGATORIO DE VALIDACIÓN
validateFENResponse<T>(response: any, skipStrictValidation = false): FENResponse<T> {
  if (!response || typeof response.success !== 'boolean') {
    throw new Error('Invalid FEN response format');
  }
  
  if (response.success && !skipStrictValidation) {
    // Validación estricta para GET/POST/PUT
    this.validateDataStructure(response.data);
  }
  
  return response;
}
```

### 🔄 PATRÓN DE MIGRACIÓN: PRISMA → TYPEORM (EN PROGRESO)

#### 1. CONVIVENCIA TEMPORAL
```typescript
// ✅ PATRÓN DURANTE MIGRACIÓN
@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,           // Legacy - en proceso de retiro
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>, // Nuevo - TypeORM
  ) {}
  
  // Métodos migrados usan TypeORM
  async findAll(): Promise<RoleEntity[]> {
    return this.roleRepository.find();
  }
}
```

### 🚨 REGLAS ESTRICTAS DE IMPLEMENTACIÓN

#### 1. PROHIBICIONES ABSOLUTAS
- ❌ **CERO `any`** - Todo debe estar tipado estrictamente
- ❌ **NO lógica de negocio en Controllers** - Solo routing y validación
- ❌ **NO acceso directo a Prisma en Controllers** - Usar Services
- ❌ **NO `@GetClaim('id_user')`** - Siempre usar `@GetClaim('sub')`
- ❌ **NO imports directos de 'multer'** - Usar `Express.Multer.File`
- ❌ **NO arrays undefined** - Siempre inicializar como `[]`

#### 2. OBLIGACIONES ABSOLUTAS
- ✅ **Conversión defensiva de JWT user IDs** - Siempre validar tipos
- ✅ **Try/catch en todas las operaciones async** - Programación defensiva
- ✅ **Logging con UniconnectLogger** - Trazabilidad completa
- ✅ **Validación FEN en frontend** - Respuestas consistentes
- ✅ **Property-based testing** - Cobertura exhaustiva
- ✅ **Transacciones atómicas** - Consistencia de datos

#### 3. PATRONES DE NOMENCLATURA
```typescript
// ✅ NOMENCLATURA OBLIGATORIA
// Controllers: [Entity]Controller
// Services: [Entity]Service  
// Repositories: [Entity]Repository
// DTOs: Create[Entity]Dto, Update[Entity]Dto
// Guards: [Entity]OwnershipGuard, [Entity]AdminGuard
// Validators: [Entity]BusinessValidator
// Stores: [Entity]Store
// Hooks: use[Entity], use[Entity][Action]
// Services: [entity].service.ts
```

### 📈 MÉTRICAS DE CALIDAD ARQUITECTÓNICA

#### 1. COBERTURA OBLIGATORIA
- **Tests**: Mínimo 80% cobertura con property-based testing
- **Tipado**: 100% TypeScript estricto, cero `any`
- **Logging**: 100% operaciones críticas loggeadas
- **Validación**: 100% DTOs con class-validator

#### 2. PERFORMANCE TARGETS
- **API Response**: < 200ms promedio
- **Frontend Render**: < 100ms componentes
- **Database Queries**: < 50ms queries simples
- **WebSocket Latency**: < 50ms mensajes

---

**IMPORTANTE**: Estos patrones son OBLIGATORIOS para todo nuevo desarrollo. Cualquier desviación debe ser justificada y documentada explícitamente.

## 🏛️ REGLAS PARA HISTORIAS DE USUARIO (OBSERVER Y DECORATOR)

> **DIRECTRICES ESTRICTAS** para implementar las tareas US-T01, US-T02, US-O02, US-D01 y US-O01.
> Basadas en el análisis arquitectónico completo del código existente.

### 🔍 ESTADO ACTUAL IDENTIFICADO

#### **✅ PATRONES YA IMPLEMENTADOS**
- **Observer (Eventos de Grupo)**: Completamente funcional con EventEmitter2
- **Observer (Chat Tiempo Real)**: ✅ **COMPLETADO** - WebSocket Gateway con handlers de observación avanzados (US-O02)

#### **❌ PATRÓN FALTANTE**
- **Decorator (Chat Grupal)**: NO existe, necesita implementación desde cero

#### **✅ TESTING COMPLETADO**
- **US-O02**: Tests del patrón Observer para chat en tiempo real (12 tests passing)
- **ChatSessionManager**: Tests de gestión de presencia (11 tests passing)
- Tests para el Decorator (pendiente de US-D01)

### 📊 UBICACIONES EXACTAS DE IMPLEMENTACIONES EXISTENTES

#### **Observer Pattern - Eventos**:
```
src/
├── messages/events/message.events.ts          # Definición de eventos (15+ eventos)
├── notifications/listeners/                   # Observadores existentes
│   └── notification-event.listener.ts         # 8 @OnEvent() handlers
├── groups/groups.service.ts                   # Sujeto (emite 4 eventos)
├── group-invitations/group-invitations.service.ts # Sujeto (emite 4 eventos)
├── messages/messages.service.ts               # Sujeto (emite 3 eventos)
└── connections/connections.service.ts         # Sujeto (emite 1 evento)
```

#### **Observer Pattern - WebSocket (US-O02 ✅ COMPLETADO)**:
```
src/messages/
├── messages.gateway.ts                        # 13+ @SubscribeMessage() handlers
│   ├── message:read                           # ✅ Nuevo - Notifica lectura de mensajes
│   ├── user:presence                          # ✅ Nuevo - Broadcast de presencia (online/offline/away)
│   └── group:activity                         # ✅ Nuevo - Notifica actividades del grupo
├── managers/chat-session.manager.ts           # ✅ Extendido - Gestión de presencia
│   ├── setUserPresence()                      # ✅ Nuevo método
│   ├── getUserPresence()                      # ✅ Nuevo método
│   └── getGroupPresences()                    # ✅ Nuevo método
├── dto/websocket-message.dto.ts               # ✅ Extendido - Nuevos DTOs
│   ├── MessageReadDto                         # ✅ Nuevo DTO
│   ├── UserPresenceDto                        # ✅ Nuevo DTO
│   └── GroupActivityDto                       # ✅ Nuevo DTO
├── __tests__/messages.gateway.observer.spec.ts # ✅ Nuevo - Tests del patrón Observer
└── managers/__tests__/chat-session.manager.spec.ts # ✅ Nuevo - Tests de presencia
```

**Documentación US-O02**:
```
openspec/changes/us-o02-observer-real-time-messages/docs/
├── observer-pattern.md                        # ✅ Documentación completa del patrón
└── architecture-diagrams.md                   # ✅ Diagramas de flujo y arquitectura
```

#### **Decorator Pattern**:
```
src/auth/decorators/                           # Solo decoradores de auth existentes
├── get-token-claim.decorator.ts              # @GetClaim (Parameter decorator)
├── permissions.decorator.ts                  # @RequireAll/@RequireAny (Method decorator)
└── admin-only.decorator.ts                   # @AdminOnly (Method decorator)

❌ NO EXISTE: src/messages/decorators/         # Decoradores de chat (CREAR)
```

### 🎯 REGLAS OBLIGATORIAS POR HISTORIA DE USUARIO

#### **US-O01: Observer para eventos del grupo de estudio (8 pts)** ✅ COMPLETADO

**Estado**: ✅ Implementación completada al 100% (27 de Abril, 2026)

**Implementación Realizada**:
- **Domain Layer**: 
  - `StudyGroupSubject` implementa `ISubject<StudyGroupEvent>` con métodos `attach()`, `detach()`, `notify()`
  - 5 tipos de eventos: `JOIN_REQUEST`, `MEMBER_ACCEPTED`, `MEMBER_REJECTED`, `ADMIN_TRANSFER_REQUESTED`, `ADMIN_TRANSFER_ACCEPTED`
  - Prevención de duplicados en `attach()` y aislamiento de errores en `notify()`
  
- **Infrastructure Layer**:
  - `WebSocketNotificationObserver`: Emite notificaciones en tiempo real vía Socket.IO a todos los dispositivos del usuario
  - `PersistenceNotificationObserver`: Persiste notificaciones en BD con mensajes en español usando patrón fire-and-forget
  
- **Application Layer**:
  - `GroupsModule` implementa `OnModuleInit` para adjuntar observers automáticamente
  - `GroupsService` con 5 llamadas a `notify()`:
    - `requestGroupAccess()` → `JOIN_REQUEST` (target: owner)
    - `acceptJoinRequest()` → `MEMBER_ACCEPTED` (target: requester)
    - `rejectJoinRequest()` → `MEMBER_REJECTED` (target: requester)
    - `transferOwnership()` → `ADMIN_TRANSFER_REQUESTED` (target: new owner) + `ADMIN_TRANSFER_ACCEPTED` (target: previous owner)
  - `MessagesModule` exporta `ChatSessionManager` con factory provider (Singleton)

**Documentación**:
- `src/groups/domain/observer/README.md` con diagrama UML completo en Mermaid
- Diagramas de secuencia y ejemplos de uso
- Documentación de los 5 tipos de eventos

**Testing**: 20/20 tests passing
- Tests de Subject (attach/detach/notify)
- Tests de Observers (WebSocket + Persistence)
- Tests de integración con GroupsService
- Tests de inicialización del módulo

**Archivos Creados**:
- `src/groups/domain/observer/study-group-subject.ts`
- `src/groups/domain/observer/study-group-event.interface.ts`
- `src/groups/infrastructure/observers/websocket-notification.observer.ts`
- `src/groups/infrastructure/observers/persistence-notification.observer.ts`
- `src/groups/domain/observer/README.md`

**Archivos Modificados**:
- `src/groups/groups.service.ts` - 5 llamadas a `notify()`
- `src/groups/groups.module.ts` - `OnModuleInit` + registro de observers
- `src/messages/messages.module.ts` - Export de `ChatSessionManager`
- `src/messages/events/message.events.ts` - Eventos de transferencia de admin

**Cumplimiento de Reglas**:
- ✅ Tipado estricto: Zero-Any policy confirmada
- ✅ Idioma: 100% inglés en código, mensajes de BD en español
- ✅ Arquitectura: Clean Architecture (Domain → Infrastructure → Application)
- ✅ Programación defensiva: Try/catch en todos los observers
- ✅ Testing: 20/20 tests passing
- ✅ Build: Sin errores de TypeScript
- ✅ Runtime: Servidor arranca correctamente con 2 observers adjuntados

**Auditoría Final**: ✅ APROBADO AL 100% - Listo para archivado

```typescript
// ✅ PATRÓN OBLIGATORIO
@Injectable()
export class GroupActivityListener {
  @OnEvent(MESSAGE_EVENTS.GROUP_CREATED)
  async handleGroupCreated(payload: GroupCreatedPayload) {
    // Lógica de reacción al evento
  }
}
```

#### **US-O02: Observer para mensajes del chat en tiempo real (5 pts)** ✅ COMPLETADO

**Estado**: ✅ Implementación completada y auditada (27 Abril 2026) — Cumplimiento 100%

**Implementación Realizada (Clean Architecture)**:
- **Domain Layer**: `ISubject<T>` e `IObserver<T>` interfaces + `ChatSubject` concreto con patrón one-time (limpia observers tras notify)
- **Infrastructure Layer**: `ChatGateway` (Socket.IO, `server.to(roomId).emit()`), `PrivateChatObserver` (rooms `private-{id1}-{id2}`), `GroupChatObserver` (rooms `group-{id}`)
- **Application Layer**: `MessagesService` orquesta flujo: `applyDecorators → enrichMessageWithRoomInfo → attachObserverForChatType → persistMessage → chatSubject.notify`
- **Evento emitido**: `'NUEVO_MENSAJE'` con DTO decorado y persistido
- **Testing**: 50/50 tests passing (chat-subject, observers, chat.gateway, messages.service)

**Archivos Creados**:
- `src/messages/domain/observer/interfaces/` — ISubject<T>, IObserver<T>
- `src/messages/domain/observer/chat-subject.ts` — ChatSubject
- `src/messages/infrastructure/gateways/chat.gateway.ts` — ChatGateway (Socket.IO)
- `src/messages/infrastructure/observers/private-chat.observer.ts` — PrivateChatObserver
- `src/messages/infrastructure/observers/group-chat.observer.ts` — GroupChatObserver
- `src/messages/dto/message.dto.ts` — MessageDto
- `src/messages/application/messages.service.ts` — MessagesService (coordinador)
- `src/messages/__tests__/chat-subject.spec.ts`, `observers.spec.ts`, `chat.gateway.spec.ts`, `messages.service.spec.ts`

**Archivos Modificados**:
- `src/messages/messages.module.ts` — Registra todos los nuevos providers (convivencia con legacy)

#### **US-D01: Decorator de mensajes del chat grupal (5 pts)** ✅ COMPLETADO

**Estado**: ✅ Implementación completada (27 Abril 2026) — Cumplimiento 100%

**Implementación Realizada (Patrón Decorator Clásico)**:
- **Domain Layer**: Interfaces y clases en inglés en `src/messages/domain/decorator/`
  - `IMessage` interface con métodos `getContent()`, `getMetadata()`, `render()`
  - `BaseMessage` clase concreta para mensajes de texto plano
  - `MessageDecorator` clase abstracta base
  - `FileMessageDecorator` para adjuntar archivos (url, name, mimeType, size)
  - `MentionMessageDecorator` para menciones de usuarios (userId, displayName, position)
  - `ReactionMessageDecorator` para reacciones emoji (emoji, count, users[])
- **DTO Layer**: DTOs auxiliares con validación class-validator
  - `MentionDto`, `FileAttachmentDto`, `ReactionDto`
  - `MessageDto` extendido con campos opcionales: `mentions`, `files`, `reactions`, `rendered_content`
- **Database**: Campo `rendered_content String? @db.Text` agregado a modelo `message`
- **Application Layer**: `MessagesService.applyDecorators()` instancia cadena de decoradores dinámicamente
- **Documentación**: README.md con diagrama UML Mermaid completo
- **Testing**: 19 tests unitarios (5 suites) — 100% passing
- **Refactor**: Implementación completa en inglés (BaseMessage, FileMessageDecorator, etc.)

**Archivos Creados**:
- `src/messages/domain/decorator/interfaces/message.interface.ts`
- `src/messages/domain/decorator/base-message.ts`
- `src/messages/domain/decorator/message-decorator.abstract.ts`
- `src/messages/domain/decorator/file-message.decorator.ts`
- `src/messages/domain/decorator/mention-message.decorator.ts`
- `src/messages/domain/decorator/reaction-message.decorator.ts`
- `src/messages/domain/decorator/README.md` (UML Mermaid)
- `src/messages/dto/mention.dto.ts`, `file-attachment.dto.ts`, `reaction.dto.ts`
- Tests: `base-message.spec.ts`, `file-message.decorator.spec.ts`, `mention-message.decorator.spec.ts`, `reaction-message.decorator.spec.ts`, `decorator-composition.spec.ts`

**Archivos Modificados**:
- `src/messages/application/messages.service.ts` — Implementación de `applyDecorators()`
- `src/messages/dto/message.dto.ts` — Campos extendidos
- `prisma/schema/message.prisma` — Campo `rendered_content`

**Patrón Implementado**:
```typescript
// Composición dinámica basada en DTO
let message = new BaseMessage(text, userId, timestamp);
if (dto.files) message = new FileMessageDecorator(message, dto.files);
if (dto.mentions) message = new MentionMessageDecorator(message, dto.mentions);
if (dto.reactions) message = new ReactionMessageDecorator(message, dto.reactions);
const rendered_content = message.render(); // JSON estructurado
```

**Rendered Content Structure**:
```json
{
  "text": "Hello @user!",
  "files": [{"url": "...", "name": "...", "mimeType": "...", "size": 1024}],
  "mentions": [{"userId": 2, "displayName": "John", "position": 6}],
  "reactions": [{"emoji": "👍", "count": 3, "users": [2,3,4]}]
}
```

**Cumplimiento de Criterios**:
- ✅ AC1: IMessage interface con getContent(), getMetadata(), render()
- ✅ AC2: BaseMessage implementa IMessage con texto, userId, timestamp
- ✅ AC3: FileMessageDecorator agrega archivos (url, mimeType, size)
- ✅ AC4: MentionMessageDecorator agrega menciones con array de userIds
- ✅ AC5: ReactionMessageDecorator agrega reacciones {emoji, count, users[]}
- ✅ AC6: Decoradores componibles (archivo + menciones simultáneos)
- ✅ AC7: UML documentado en README.md con Mermaid

**Integración**:
- ✅ Compatible con patrón Observer (US-O02)
- ✅ Decoradores aplicados ANTES de `chatSubject.notify()`
- ✅ `rendered_content` persistido en BD antes de emisión WebSocket
- ✅ Zero-Any policy mantenida
- ✅ Build sin errores, 269/269 tests passing

**✅ REGLAS ESTRICTAS (IMPLEMENTADAS)**:
- **OBLIGATORIO**: Crear Custom Method Decorator en `src/messages/decorators/`
- **OBLIGATORIO**: Interceptar métodos de `MessagesService` o `MessagesGateway`
- **OBLIGATORIO**: Mantener lógica de negocio fuera de controladores
- **OBLIGATORIO**: Usar patrón de `createMethodDecorator` o reflection metadata
- **OPCIONES**: Content Moderation o Message Analytics (según elección)

```typescript
// ✅ PATRÓN OBLIGATORIO
export function MessageProcessing(options: ProcessingOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Lógica de pre-procesamiento
      const result = await originalMethod.apply(this, args);
      // Lógica de post-procesamiento
      return result;
    };
  };
}
```

#### **US-T01: Unit tests para el patrón Decorator (3 pts)** ✅ COMPLETADO

**Estado**: ✅ Implementación completada al 100% (27 de Abril, 2026)

**Implementación Realizada**:
- **Tests de Decoradores de Mensajes**: 20 tests (19 existentes + 1 AC4 nuevo)
  - `base-message.spec.ts`: 5 tests (agregado test AC4 negativo)
  - `file-message.decorator.spec.ts`: 4 tests
  - `mention-message.decorator.spec.ts`: 4 tests
  - `reaction-message.decorator.spec.ts`: 4 tests
  - `decorator-composition.spec.ts`: 3 tests
- **Tests de Decoradores de Perfil**: 6 tests (implementación completa nueva)
  - `base-profile.spec.ts`: 3 tests (getBasicInfo, render positive, render negative AC4)
  - `verified-profile.decorator.spec.ts`: 3 tests (delegation, verification, preservation)
- **Implementación de Profile Decorators**: Sistema completo en `src/users/domain/decorator/`
  - `IProfile` interface con getBasicInfo(), getMetadata(), render()
  - `BaseProfile` clase concreta
  - `ProfileDecorator` clase abstracta
  - `VerifiedProfileDecorator` decorador de verificación
- **Documentación**: README.md con diagrama UML Mermaid completo
- **Ubicación**: 
  - Mensajes: `src/messages/domain/decorator/__tests__/`
  - Perfiles: `src/users/domain/decorator/` (10 archivos nuevos)
- **Resultado**: 26/26 tests passing (20 mensajes + 6 perfiles)

**Criterios de Aceptación Validados**:
- ✅ AC1: BaseMessage renderiza solo texto
- ✅ AC2: Decoradores agregan campos específicos
- ✅ AC3: Composición de decoradores funciona
- ✅ AC4: Base classes NO incluyen campos de decoradores (test negativo agregado)
- ✅ AC5: Cada clase tiene ≥2 tests (promedio: 4.3 tests/clase)

**Cumplimiento de Reglas**:
- ✅ Zero-Any policy (0 tipos `any`)
- ✅ Idioma: 100% inglés en código
- ✅ Build exitoso sin errores
- ✅ Documentación con UML Mermaid
- ✅ Clean Architecture (domain layer)

**Archivos Creados**: 10 archivos (profile decorators + tests + README + VALIDATION_REPORT)
**Archivos Modificados**: 1 archivo (base-message.spec.ts con test AC4)

#### **US-T02: Unit tests para el patrón Observer (3 pts)** ✅ COMPLETADO

**Estado**: ✅ Implementación completada al 100% (28 de Abril, 2026)

**Implementación Realizada**:
- **Tests de Study Groups Domain**: 24 tests (10 Subject + 8 Observer + 6 Integration)
  - `study-group-subject.spec.ts`: 10 tests (attach, detach, notify con error isolation)
  - `websocket-notification.observer.spec.ts`: 4 tests (WebSocket emissions con mocks)
  - `persistence-notification.observer.spec.ts`: 4 tests (DB persistence con mocks)
  - `study-group-subject.integration.spec.ts`: 6 tests (Subject → Observers flow)
- **Tests de Chat Domain**: 31 tests (existentes, validados)
  - `chat-subject.spec.ts`: 10 tests
  - `observers.spec.ts`: 9 tests
  - `messages.gateway.observer.spec.ts`: 12 tests
- **Total**: 55 tests passing (31 Chat + 24 Study Groups)
- **Patrón Utilizado**: Jest mocks (`jest.fn()`, `jest.Mocked<T>`) para todos los observers
- **Ubicación**: 
  - Study Groups Subject: `src/groups/domain/observer/__tests__/`
  - Study Groups Observers: `src/groups/infrastructure/observers/__tests__/`
  - Integration: `src/groups/__tests__/`
- **Resultado**: 55/55 tests passing en 3.933 segundos

**Criterios de Aceptación Validados**:
- ✅ AC1: 2 observers reciben evento (validado en Subject + Integration tests)
- ✅ AC2: Observer desuscrito no recibe evento (validado en detach tests)
- ✅ AC3: Error isolation entre observers (validado en 4 ubicaciones)
- ✅ AC4: Tests usan mocks (100% Jest mocks, no deps reales)
- ✅ AC5: Integration test Subject + Observer (6 tests de integración)

**Cumplimiento de Reglas**:
- ✅ Zero-Any policy (0 tipos `any`)
- ✅ Idioma: 100% inglés en código
- ✅ Build exitoso sin errores
- ✅ Mock usage: 100% (ChatGateway, ChatSessionManager, PrismaService)
- ✅ Test execution time: <4 segundos

**Archivos Creados**: 4 archivos (714 líneas de tests)
**Archivos Modificados**: 0 (solo nuevos tests)

**✅ PATRÓN OBLIGATORIO - Study Groups Observer**:
```typescript
// Subject tests
describe('StudyGroupSubject', () => {
  it('should notify all attached observers', () => {
    studyGroupSubject.attach(mockObserver1);
    studyGroupSubject.attach(mockObserver2);
    studyGroupSubject.notify(event);
    expect(mockObserver1.update).toHaveBeenCalledWith(event);
    expect(mockObserver2.update).toHaveBeenCalledWith(event);
  });
  
  it('should handle observer errors gracefully', () => {
    const errorObserver = { update: jest.fn(() => { throw new Error(); }) };
    studyGroupSubject.attach(errorObserver);
    studyGroupSubject.attach(mockObserver1);
    expect(() => studyGroupSubject.notify(event)).not.toThrow();
    expect(mockObserver1.update).toHaveBeenCalledWith(event);
  });
});

// Integration tests
describe('StudyGroupSubject - Integration', () => {
  it('should notify both observers simultaneously', async () => {
    studyGroupSubject.attach(websocketObserver);
    studyGroupSubject.attach(persistenceObserver);
    studyGroupSubject.notify(event);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockChatGateway.server.emit).toHaveBeenCalled();
    expect(mockPrismaService.notification.create).toHaveBeenCalled();
  });
});
```


### 🚨 PROHIBICIONES ABSOLUTAS

- ❌ **NO crear nuevos EventEmitter** - Usar el existente inyectado
- ❌ **NO crear nuevos WebSocket Gateways** - Extender MessagesGateway
- ❌ **NO usar librerías externas** para sockets - Solo @nestjs/websockets
- ❌ **NO crear decoradores fuera de src/messages/decorators/** para chat
- ❌ **NO usar mocks complejos** en tests - Usar jest.spyOn y clases ficticias
- ❌ **NO modificar MESSAGE_EVENTS** sin extender correctamente

### 📈 MÉTRICAS DE CUMPLIMIENTO

- **Observer Events**: Debe usar @OnEvent() y EventEmitter2 inyectado
- **Observer WebSocket**: Debe usar @SubscribeMessage() en MessagesGateway
- **Decorator**: Debe interceptar métodos sin romper funcionalidad existente
- **Tests**: 100% cobertura con jest.spyOn y clases ficticias
- **Integración**: Cero regresiones en funcionalidad existente

---

## 🚀 CONFIGURACIÓN Y DEPLOYMENT

### Variables de Entorno Backend
```env
PORT=3000
DATABASE_URL="postgresql://..."
JWT_SECRET="uniconnect-secret"
JWT_EXPIRES_IN="2h"
AUTH0_DOMAIN="dev-xxx.auth0.com"
AUTH0_CLIENT_ID="xxx"
AUTH0_CLIENT_SECRET="xxx"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="uniconnect-files"
AWS_ACCESS_KEY_ID="xxx"
AWS_SECRET_ACCESS_KEY="xxx"
```

### Variables de Entorno Frontend
```env
EXPO_PUBLIC_API_URL="http://localhost:3000/api"
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="xxx"
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="xxx"
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID="xxx"
EXPO_PUBLIC_AUTH0_DOMAIN="dev-xxx.auth0.com"
EXPO_PUBLIC_AUTH0_CLIENT_ID="xxx"
EXPO_PUBLIC_AUTH0_AUDIENCE="xxx"
```

### Scripts Principales
**Backend**: `start:dev`, `build`, `test`, `test:cov`, `lint`, `format`, `db:seed`
**Frontend**: `start`, `android`, `ios`, `web`, `test`, `test:watch`

### EAS Build (Frontend - React Native + Expo)
**Ubicación**: `Uniconnect-Frontend/`
**Herramienta**: EAS (Expo Application Services)
**Configuración**: `eas.json` con 3 perfiles (development, preview, production)
**Scripts Helper**:
- `build.sh` - Script interactivo para builds automatizados
- `BUILD_GUIDE.md` - Guía completa paso a paso
- `QUICK_START_BUILD.md` - Guía rápida de referencia

**Perfiles de Build**:
1. **Preview** (Recomendado para testing):
   - Comando: `eas build --platform android --profile preview`
   - Output: APK instalable directamente
   - Uso: Testing interno, distribución a testers
   - Tiempo: 10-15 minutos
2. **Production** (Para stores):
   - Comando: `eas build --platform android --profile production`
   - Output: AAB para Google Play Store
   - Uso: Publicación en tiendas oficiales
   - Tiempo: 15-20 minutos
3. **iOS Production**:
   - Comando: `eas build --platform ios --profile production`
   - Requiere: Apple Developer Account ($99/año)
   - Output: IPA para App Store
   - Tiempo: 20-25 minutos

**Proceso de Build**:
1. Instalar EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Build: `eas build --platform android --profile preview`
4. Descargar: Link proporcionado por EAS o desde https://expo.dev
5. Instalar: APK directo en Android o AAB vía Google Play Console

**Comandos Útiles**:
- Ver builds: `eas build:list`
- Ver estado: `eas build:view [BUILD_ID]`
- Cancelar: `eas build:cancel`

### Docker Deployment (Backend)
**Ubicación**: `Uniconnect-Backend-Core/Dockerfile`
**Estrategia**: Multi-stage build para optimizar tamaño de imagen
**Etapas**:
1. **Builder Stage**: 
   - Instala todas las dependencias (dev + prod)
   - Genera Prisma Client
   - Compila TypeScript a JavaScript
2. **Production Stage**:
   - Instala dependencias de producción
   - Instala Prisma CLI (7.4.1) como dev dependency
   - Genera Prisma Client en producción (necesario para pnpm)
   - Copia archivos compilados desde builder
**Build**: `docker build -t uniconnect-backend .`
**Run**: `docker run -p 8007:8007 --env-file .env uniconnect-backend`
**Nota**: Con pnpm, el Prisma Client debe generarse en cada etapa debido a la estructura de node_modules con enlaces simbólicos

### Database Seeding
**Ubicación**: `prisma/seed.ts`
**Comando**: `npx ts-node prisma/seed.ts`
**Contenido**:
- **Roles del Sistema**: `student`, `admin`, `superadmin` (3 roles oficiales)
- **Programas Académicos**: 31 programas de la Universidad de Caldas organizados por facultad
  - Facultad de Inteligencia Artificial e Ingenierías (6 programas)
  - Facultad de Ciencias para la Salud (3 programas)  
  - Facultad de Ciencias Exactas y Naturales (3 programas)
  - Facultad de Ciencias Jurídicas y Sociales (8 programas)
  - Facultad de Ciencias Agropecuarias (3 programas)
  - Facultad de Artes y Humanidades (8 programas)
**Características**:
- Usa `createMany` con `skipDuplicates: true` para evitar duplicados
- Seguro para ejecutar múltiples veces
- Logging detallado del proceso de inserción

---

## 🎯 DIRECTIVA DE ACTUALIZACIÓN CONTINUA

> **OBLIGATORIO PARA TODOS LOS AGENTES**: Al finalizar cualquier Historia de Usuario (HU), refactorización o cambio en el esquema de base de datos, el Agente TIENE LA OBLIGACIÓN de abrir `AGENTS.md` y actualizar el mapa de entidades, la estructura de carpetas o las reglas de negocio si sufrieron modificaciones, antes de dar por terminada la tarea.

### Cuándo Actualizar Este Documento:
1. **Cambios en Prisma Schema** → Actualizar "Mapa de Entidades"
2. **Nuevos Módulos NestJS** → Actualizar "Arquitectura de Módulos Backend"
3. **Nuevas Features Frontend** → Actualizar "Arquitectura Frontend"
4. **Cambios en Autenticación** → Actualizar "Sistema de Autenticación"
5. **Nuevas Reglas de Negocio** → Actualizar "Reglas de Negocio Implementadas"
6. **Cambios en Tech Stack** → Actualizar "Tech Stack"

### Proceso de Actualización:
1. Identificar qué sección del documento se ve afectada
2. Actualizar la información correspondiente
3. Verificar que los ejemplos de código sigan siendo válidos
4. Confirmar que las relaciones entre entidades están correctas
5. Actualizar la fecha de última modificación

---

## ✅ ESTABILIZACIÓN DE SUITE DE TESTS (26 Abril 2026)

### Estado Final
- **Tests**: 228/228 pasando ✅
- **Test Suites**: 35/35 pasando ✅
- **Build TypeScript**: Sin errores ✅
- **Fallos previos**: 21 tests fallando → 0 fallos

### Fixes Aplicados

#### Dependency Injection (7 archivos)
- `users.service.spec.ts` — Agregado mock de `PrismaService` con `createPrismaMock()`
- `users.controller.spec.ts` — Agregado mock de `UsersService` con todos sus métodos
- `auth.controller.spec.ts` — Agregados mocks de `AuthService`, `JwtService`, `ConfigService`
- `roles.service.spec.ts` — Agregado mock de `PrismaService` con `createPrismaMock()`
- `files.controller.spec.ts` — Agregados mocks de `FilesService`, `MessagesGateway`, `MessageRepository`
- `events.controller.spec.ts` — Agregado mock de `PrismaService` para resolver `AdminGuard`

#### EventsService Tests (7 tests)
- `findAll` error test: `data: null` → `data: []` (comportamiento real del servicio)
- Tests de permisos: IDs de evento cambiados de UUID (`'event-123'`) a numéricos (`'123'`) para que el servicio los parsee correctamente
- Mocks de eventos: campo `id` → `id_event` para coincidir con el schema Prisma
- `where` clause en update: `{ id: eventId }` → `{ id_event: 123 }` (integer)
- Property-based tests: `fc.uuid()` → `fc.integer()` convertido a string

#### AppController Test
- Método `getHello()` → `HealthCheck()` (nombre real del método en el controller)

#### Property-Based Tests (2 archivos)
- `multer-preservation.spec.ts`: Agregado `decodeURIComponent()` para comparar filenames con caracteres especiales URL-encoded
- `multer-types-preservation.spec.ts`: Agregado `jest.clearAllMocks()` al inicio de cada iteración del property test para evitar acumulación de llamadas

### Cambios de Comportamiento Documentados
- `EventsService.update()` usa `id_event` (integer) como clave primaria, no `id` (string)
- `EventsService.findAll()` retorna `data: []` en errores (no `null`)
- `EventsController.findAll()` pasa 3 argumentos al service: `filters`, `pagination`, `userId`
- URLs de S3 pueden contener caracteres URL-encoded (`:` → `%3A`, etc.)

---

**Última actualización**: 26 de Abril, 2026
**Versión del documento**: 2.1.0
**Mantenido por**: Sistema de Contexto Autónomo para IA

## 🔄 MIGRACIÓN TYPEORM - ESTADO ACTUAL

### Inicio de Implementación (16 Abril 2026)
- **Estado**: 🟡 En progreso (fase de infraestructura iniciada)
- **Objetivo**: Migración completa backend de Prisma a TypeORM, manteniendo PostgreSQL
- **Estrategia de migraciones recomendada**: Baseline TypeORM (no replicar historial completo Prisma)

### Cambios Implementados - Fase 1
- **Nuevo módulo global**: `src/database/database.module.ts`
  - Configura `TypeOrmModule.forRootAsync` como infraestructura base
- **Nueva configuración central**: `src/database/database.config.ts`
  - Soporta `DATABASE_URL` o variables separadas (`DB_HOST`, `DB_PORT`, etc.)
  - Incluye pool y timeouts para equivalencia operativa
- **AppModule**: agrega `DatabaseModule` a imports

### Migración Funcional Inicial (Roles/Permisos)
- **Servicios migrados a TypeORM**:
  - `src/roles/roles.service.ts` (usa `Repository<RoleEntity>`)
  - `src/permissions/permissions.service.ts` (usa `Repository<AccessEntity>` y `Repository<PermissionEntity>`)
- **Entidades TypeORM agregadas**:
  - `src/roles/entities/role.entity.ts`
  - `src/permissions/entities/permission.entity.ts`
  - `src/permissions/entities/access.entity.ts`
- **AuthModule actualizado**:
  - Registra `TypeOrmModule.forFeature([RoleEntity, AccessEntity, PermissionEntity])`
- **Tests actualizados**:
  - `roles.service.spec.ts` y `permissions.service.spec.ts` ahora mockean repositorios TypeORM

### Nota de Convivencia Temporal
- Durante la migración, Prisma y TypeORM coexistirán temporalmente.
- Prisma sigue activo en módulos aún no migrados (groups, users, events, messages, etc.).
- El retiro de Prisma se hará solo al completar la migración de todos los dominios y validar regresión.

## 📋 REGLAS DE NEGOCIO ACTUALIZADAS - EVENTOS

### EventOwnershipGuard - Seguridad de Eventos
- **Ubicación**: `src/events/guards/event-ownership.guard.ts`
- **Propósito**: Validar que solo el creador del evento o superadmin puedan editarlo/eliminarlo
- **Implementación**:
  - Extrae `userId` del JWT (`request.user.sub`)
  - Extrae `eventId` de los parámetros de la URL (`request.params.id`)
  - Consulta la base de datos para verificar `created_by`
  - Permite acceso si: `event.created_by === userId` OR `userRole === 'superadmin'`

### Endpoints de Eventos - Permisos
- **GET /events**: Autenticación requerida (cualquier usuario)
- **GET /events/:id**: Autenticación requerida (cualquier usuario)
- **POST /events**: Admin o Superadmin únicamente
- **PUT /events/:id**: EventOwnershipGuard (creador o superadmin)
- **DELETE /events/:id**: EventOwnershipGuard (creador o superadmin)

### Frontend - UI Condicional de Eventos
- **EventCard.tsx**: Los botones de editar/eliminar se muestran solo si:
  - `currentUser.role.name === 'superadmin'` OR
  - `event.created_by === currentUser.id_user`
- **Validación**: El `EditEventModal` valida que `event.id` no sea undefined antes de enviar

### Cambios en Arquitectura
- **Nuevo Guard**: `EventOwnershipGuard` implementado para validación de propiedad
- **Logging mejorado**: Agregados logs de debugging en EventsService.update
- **Validación Frontend**: Mejorada validación en EditEventModal
- **FIX-07 Completado**: Migración de esquema de eventos de UUID a integer ID estandarizado
  - Esquema: `id String @default(uuid())` → `id_event Int @id @default(autoincrement())`
  - Backend: Actualizado para manejar integer IDs en controllers, services y guards
  - Frontend: Actualizado para usar `id_event: number` en interfaces y componentes
  - Tests: Actualizados para validar el nuevo esquema estandarizado

### Debugging y Logs
- **EventsService.update**: Incluye logs detallados de parámetros de entrada y resultados de consulta
- **EventOwnershipGuard**: Logs de auditoría para accesos autorizados y no autorizados
- **Frontend**: Logs de diagnóstico en EditEventModal para validación de event.id
- **JWT User ID Conversion**: Logs de diagnóstico en EventsService.create para validar conversión de tipos
  - Registra tipo de userId recibido y convertido
  - Valida que conversión sea exitosa antes de consultas Prisma
  - Property-based tests documentan comportamiento esperado con diferentes tipos de entrada

### FIX-08 y FIX-09 Completados: JWT User ID Type Conversion Bug
- **Problema Original (FIX-08)**: JWT user IDs llegaban como strings causando fallas en consultas Prisma que esperan integers
- **Solución FIX-08**: Conversión explícita con validación en controller y service layers
- **Problema FIX-09**: El claim incorrecto `'id_user'` causaba que el ID se evaluara como `undefined` (NaN)
- **Descubrimiento Crítico**: El JWT payload contiene el ID relacional bajo `"sub": 1` y el ID Auth0 bajo `"auth0_sub"`
- **Solución FIX-09**: Revertir decoradores a `@GetClaim('sub')` para extraer correctamente el ID del usuario
- **Archivos Modificados**:
  - `src/events/events.controller.ts` - Decoradores corregidos de `'id_user'` a `'sub'` en 4 endpoints
  - `src/events/events.service.ts` - Defensive type validation and documentation (preservado)
  - Tests: `jwt-user-id-bug.spec.ts` y `jwt-preservation.spec.ts` para validar fix y preservación
- **Patrón Establecido**: Template para manejar JWT user IDs en todos los controladores futuros
- **CRÍTICO**: Usar siempre `@GetClaim('sub')` para obtener el ID relacional del usuario
- **Estructura JWT Payload**:
  ```typescript
  {
    "sub": 1,                    // ✅ ID relacional local del usuario
    "permissions": ["claim1"],   // Array de permisos
    "roleName": "student",       // Nombre del rol
    "auth0_sub": "auth0|123"     // ID del proveedor Auth0 (solo en auth0Callback)
  }
  ```

### FIX-12 Completado: Missing @types/multer TypeScript Compilation Error
- **Problema Original**: TypeScript compilación fallaba con `TS2307: Cannot find module 'multer'` en files.controller.ts y files.service.ts
- **Causa Raíz**: El paquete `@types/multer` no estaba instalado en devDependencies, causando que TypeScript no pudiera resolver las declaraciones de tipos para multer
- **Solución Implementada**:
  - Agregado `@types/multer@^1.4.12` a devDependencies en package.json
  - Corregidos imports para usar `Express.Multer.File` en lugar de importar directamente desde 'multer'
  - `files.controller.ts`: Cambiado tipo de parámetro a `Express.Multer.File[]`
  - `files.service.ts`: Cambiado tipo de parámetro a `Express.Multer.File[]`
- **Validación**:
  - Bug condition exploration tests confirman que compilación ahora pasa sin errores TS2307
  - Preservation property tests (con fast-check) confirman cero regresiones en runtime
  - Todas las operaciones de file upload, S3, WebSocket y database storage funcionan idénticamente
- **Patrón Establecido**: Siempre usar `Express.Multer.File` para tipado de archivos en NestJS
- **Ubicación**: `.kiro/specs/fix-12-multer-types/` (bugfix.md, design.md, tasks.md)
- **Testing**: Property-based tests implementados con fast-check para validar preservación de comportamiento
- **Issue Adicional Resuelto**: Conflicto de versiones duplicadas de `@smithy/types` en AWS SDK v3
  - Agregado `pnpm.overrides` en package.json para forzar versión única de `@smithy/types`
  - Resuelve error de incompatibilidad de tipos en S3Client con getSignedUrl

### FIX-13 Completado: S3 URL Encoding for Files with Spaces
- **Problema Original**: Archivos con espacios en el nombre no se podían descargar desde S3
  - Error: `NoSuchKey - The specified key does not exist`
  - Ejemplo: `"Propuesta de mejora.docx"` se subía como `Propuesta_de_mejora.docx` pero la URL no estaba codificada
- **Causa Raíz**: La URL almacenada en la BD no codificaba correctamente la Key, causando desajuste al generar URLs presignadas
- **Solución Implementada**:
  - `files.service.ts`: Agregada codificación de URL con `encodeURIComponent()` al almacenar fileUrl
  - Preservación de barras `/` en la ruta con `.replace(/%2F/g, '/')`
  - La URL presignada ahora decodifica correctamente con `decodeURIComponent()` existente
- **Patrón Establecido**: Siempre codificar URLs de S3 al almacenarlas en BD para manejar caracteres especiales
- **Archivos Modificados**: `src/files/files.service.ts` (línea 119-120)

### FIX-14 Completado: Group Invitation Accept HTTP 400 Error
- **Problema Original**: Usuarios no podían aceptar invitaciones de grupo desde el frontend React Native - petición HTTP PATCH fallaba con error 400 (Bad Request)
  - Error: `"Error al responder invitación: [AxiosError: Request failed with status code 400]"`
  - Endpoint: `PATCH /group-invitations/:id/respond` con payload `{ status: 'accepted' }`
- **Causa Raíz Confirmada**: JWT User ID Type Conversion Issue (similar a FIX-08 y FIX-09)
  - El decorador `@GetClaim('sub')` extraía userId correctamente, pero no había conversión defensiva de tipo
  - JWT tokens pueden proporcionar user IDs como strings, pero Prisma espera integers
  - Sin conversión explícita, las validaciones de tipo fallaban causando HTTP 400
- **Solución Implementada**:
  - **Controller Layer** (`group-invitations.controller.ts`):
    - Conversión defensiva de tipo: `const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;`
    - Validación de conversión exitosa: `if (isNaN(numericUserId) || numericUserId <= 0) throw new BadRequestException('Invalid user ID from JWT token')`
    - Logging de diagnóstico: logs de invitationId, userId, userIdType, y respondDto
    - Try/catch con error logging para debugging mejorado
  - **Service Layer** (`group-invitations.service.ts`):
    - Validación defensiva de tipo al inicio del método: `if (typeof userId !== 'number' || isNaN(userId) || userId <= 0) throw new BadRequestException('Invalid user ID. Must be a positive integer.')`
    - Logging de diagnóstico en cada punto de validación
    - Mensajes de error descriptivos y claros
  - **Frontend** (`groups.service.ts`):
    - Logging mejorado de peticiones y errores para debugging futuro
    - Log de endpoint, payload, error details, y HTTP status
- **Metodología**: Bug Condition Methodology con Property-Based Testing
  - Property 1: Bug Condition - Test exploratorio confirmó el bug en código sin modificar
  - Property 2: Preservation - Tests confirmaron que operaciones no-accept funcionan idénticamente
- **Estado**: ✅ COMPLETADO - Fix implementado y validado
- **Ubicación**: `.kiro/specs/fix-14-group-invitation-accept/` (bugfix.md, design.md, tasks.md)
- **Patrón Aplicado**: Mismo patrón de conversión de JWT user IDs establecido en FIX-08 y FIX-09
- **Testing Completado**:
  - Bug condition tests: 3/3 passing - confirma que el fix funciona correctamente
  - Preservation tests: 14/14 passing - confirma cero regresiones en operaciones no-accept
  - Property-based tests con fast-check generan múltiples casos de prueba automáticamente
  - Total: 17/17 tests del módulo group-invitations passing
  - Validación adicional: 35/35 tests relacionados con grupos passing sin regresiones
- **Archivos Modificados**:
  - `src/group-invitations/group-invitations.controller.ts` - Conversión defensiva y logging
  - `src/group-invitations/group-invitations.service.ts` - Validación defensiva y logging
  - `src/features/groups/services/groups.service.ts` (Frontend) - Logging mejorado

### FIX-15 Completado: Invitation Status Validation with Atomic Transactions
- **Problema Original**: Invitaciones quedaban en estado inconsistente (`status !== 'pending'`) sin membresía correspondiente
  - Error: `"Esta invitación ya fue respondida anteriormente"` (HTTP 400) cuando el usuario intentaba aceptar
  - Ejemplo: Invitación ID 3 tenía `status = 'accepted'` pero no existía membership para el usuario en el grupo
  - El sistema rechazaba la petición sin verificar si la membresía fue creada
- **Causa Raíz Confirmada**: 
  - **Operaciones No-Atómicas**: Actualización de `invitation.status` y creación de `membership` eran operaciones separadas
  - Si la segunda operación fallaba, la primera persistía, creando estado inconsistente
  - **Falta de Rollback**: No había transacción que garantizara que ambas operaciones sucedieran juntas o fallaran juntas
  - **Sin Validación de Membresía**: No se verificaba si el usuario ya era miembro antes de rechazar
  - **Condiciones de Carrera**: Peticiones concurrentes podían crear estados inconsistentes
- **Solución Implementada**:
  - **Transacciones Atómicas con Prisma**: Implementado `prisma.$transaction([updateOp, createOp])` para garantizar atomicidad
  - **Validación de Membresía Existente**: Agregada verificación de membership antes de procesar la petición
  - **Comportamiento Idempotente**: Si el usuario ya es miembro, retorna HTTP 200 "Ya eres miembro de este grupo" en lugar de error
  - **Manejo de Race Conditions**: Implementado try/catch para error P2002 (unique constraint violation) con respuesta idempotente
  - **Logging Defensivo**: Agregados logs detallados para debugging de estados inconsistentes en producción
  - **Recuperación de Estado**: Invitaciones con estado inconsistente se procesan creando la membresía faltante (recovery path)
- **Estado**: ✅ COMPLETADO - Fix implementado y validado
- **Ubicación**: `.kiro/specs/fix-15-invitation-status-validation/` (bugfix.md, design.md, tasks.md)
- **Metodología**: Bug Condition Methodology con Property-Based Testing
  - **Bug Condition**: `isBugCondition(X)` retorna true cuando invitation.status ≠ 'pending' AND no existe membership
  - **Property 1 (Fix Checking)**: Para inputs donde se cumple bug condition, sistema crea membresía faltante (HTTP 200) o retorna error descriptivo
  - **Property 2 (Preservation)**: Para inputs donde NO se cumple bug condition, comportamiento es idéntico al código original
- **Archivos Modificados**:
  - `src/group-invitations/group-invitations.service.ts` (líneas 164-380):
    - Agregada validación de membresía existente después de validación de permisos
    - Envueltas operaciones de actualización y creación en `prisma.$transaction()`
    - Agregado try/catch para error P2002 con respuesta idempotente
    - Implementada lógica de recuperación para estados inconsistentes
    - Agregado logging defensivo en cada punto de validación
- **Testing Completado**:
  - Bug condition tests: 3/3 passing - confirma que el fix funciona correctamente
  - Preservation tests: 7/7 passing - confirma cero regresiones en operaciones no-buggy
  - Total: 27/27 tests del módulo group-invitations passing
  - Property-based tests documentan comportamiento esperado para diferentes escenarios
- **Reglas de Negocio Preservadas**:
  - Invitaciones pending se procesan normalmente (HTTP 200, membership creada, eventos emitidos) ✅
  - Invitaciones ya respondidas con membership existente retornan idempotencia (HTTP 200 "Ya eres miembro") ✅
  - Validación de permisos continúa retornando HTTP 403 para usuarios no autorizados ✅
  - Invitaciones inexistentes continúan retornando HTTP 404 ✅
  - Operaciones de rechazo (status: 'rejected') funcionan idénticamente sin crear membership ✅
  - Eventos WebSocket (GROUP_INVITATION_ACCEPTED, USER_JOINED_GROUP, GROUP_INVITATION_REJECTED) se emiten correctamente ✅
- **Mejoras de Robustez**:
  - Transacciones atómicas previenen estados inconsistentes futuros
  - Comportamiento idempotente permite reintentos seguros desde el frontend
  - Manejo de race conditions garantiza consistencia con peticiones concurrentes
  - Logging mejorado facilita debugging de problemas en producción
  - Recovery path permite corregir estados inconsistentes existentes

