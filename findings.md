# Findings: Docker Build Failure on Render — `npm run generate:openapi`

## Fecha
2026-05-20

## Síntoma
`nest build` compila exitosamente, pero `npm run generate:openapi` (encadenado via `&&`) falla con `exit code 1` inmediatamente después de imprimir:

```
UniconnectLogger inicializado - Instancia única creada con 6 niveles estándar
```

---

## Cadena de Fallo — 3 Root Causes

### 🔴 RC1: `JWT_SECRET` ausente durante el build (fallo inmediato)

**Archivo**: `src/auth/auth.module.ts:29-42`

```typescript
JwtModule.registerAsync({
  useFactory: async (configService: ConfigService) => {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');  // ← EXIT CODE 1
    }
    ...
  },
});
```

Cuando `generate-openapi.ts` llama a `NestFactory.create(AppModule)`:

1. `ConfigModule.forRoot()` busca `.env` en `envFilePath`
2. `.dockerignore` **excluye explícitamente `.env`** del contexto de build
3. `configService.get('JWT_SECRET')` retorna `undefined`
4. `useFactory` lanza `Error('JWT_SECRET environment variable is required')`
5. NestJS no puede completar la creación de la app → `process.exit(1)`

**Orden de imports en `AppModule`**: AuthModule se importa en 4to lugar, ANTES que PrismaModule. Por eso JWT_SECRET falla primero.

### 🔴 RC2: `DATABASE_URL` ausente durante el build (fallo posterior)

**Archivo**: `src/prisma/prisma.service.ts:12-35`

```typescript
constructor() {
    const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,  // ← undefined en build
        ...
    });
    ...
}
async onModuleInit() {
    await this.$connect();  // ← fallaría si RC1 se soluciona
}
```

Incluso si RC1 se resuelve, `PrismaService.onModuleInit()` intentará `this.$connect()` sin una URL de base de datos válida durante el build, causando otro fallo.

### 🟡 RC3: Potencial OOM con `ts-node` cargando NestJS completo

**Archivo**: `scripts/generate-openapi.ts`

```typescript
const app = await NestFactory.create(AppModule, { logger: false });
```

- `ts-node` ejecuta TypeScript directamente SIN compilar a JS primero
- Carga los 18+ módulos de NestJS con toda su metadata de decoradores, providers, DI
- Esto ocurre en el contenedor builder de Alpine (memoria limitada) en Render
- **El exit code 1 inmediato sugiere que RC1/RC2 son los causantes**, pero OOM es un riesgo latente cuando esos se resuelvan

---

## Flujo de Inicialización (orden exacto)

```
NestFactory.create(AppModule)
│
├── 1. ConfigModule.forRoot() → busca .env → NO encontrado (.dockerignore)
│   └── process.env queda sin DATABASE_URL, JWT_SECRET, etc.
│
├── 2. ScheduleModule.forRoot()
│
├── 3. EventEmitterModule.forRoot()
│
├── 4. AuthModule
│   ├── JwtModule.registerAsync({ useFactory })
│   │   └── configService.get('JWT_SECRET') → undefined
│   │       └── throw Error('JWT_SECRET environment variable is required')
│   └── ✗ NUNCA LLEGA AQUÍ: falla en la factoría
│
├── 5. UsersModule       ← no se alcanza
├── 6. PrismaModule      ← no se alcanza
│   └── PrismaService constructor: new Pool({ connectionString: undefined })
│
├── 7-18. Resto módulos  ← no se alcanzan
│
└── onModuleInit hooks:  ← no se alcanzan
    ├── EventsModule: attach observers
    ├── GroupsModule: attach observers
    └── PollSchedulerService: close expired polls → $connect() ← fallaría
```

---

## Diagnóstico de Memoria

| Factor | Impacto |
|--------|---------|
| **ts-node** interpreta TypeScript en caliente | Moderado — requiere heap para AST + decoradores |
| **18 módulos** con DI reflection metadata | Alto — cada módulo carga sus providers, guards, decorators |
| **Alpine Linux** en builder de Render | Limitado ~512MB-1GB según plan |
| **pg Pool** + **Prisma Client** + **AWS SDK** | Alto — varias librerías pesadas en memoria |

**Conclusión OOM**: RC1 (JWT_SECRET) causa fallo inmediato antes de que el consumo de memoria sea un problema. Si RC1 y RC2 se resuelven, OOM es un riesgo real que debe mitigarse.

---

## Enfoques de Solución (solo exploración, no implementación)

### A. Mockear variables de entorno en el build
Inyectar `JWT_SECRET=dummy` y `DATABASE_URL=dummy` durante la etapa de build:
```dockerfile
ARG JWT_SECRET=dummy
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV JWT_SECRET=$JWT_SECRET
ENV DATABASE_URL=$DATABASE_URL
```
⚠️ Contras: las factories siguen ejecutándose, el pool de pg intentará conectar, `$connect()` fallará.

### B. Desacoplar `generate:openapi` del build
Separar `nest build` de `generate:openapi`:
```dockerfile
RUN nest build
# No ejecutar generate:openapi aquí
# Ejecutarlo solo cuando haya base de datos disponible
```
El `CMD` de producción puede correr `generate:openapi` al iniciar (es idempotente).

### C. Hacer `generate-openapi.ts` resiliente
Modificar el script para inyectar valores dummy solo durante la generación de OpenAPI, sin depender de variables reales. El script NO ejecuta el servidor, solo genera el documento Swagger.

### D. Pre-compilar `generate-openapi.ts` a JS
En lugar de `ts-node`, compilar `scripts/generate-openapi.ts` durante el build y ejecutar el JS resultante. Esto elimina la sobrecarga de `ts-node` y mitiga OOM.

---

## Resumen

| Causa | Archivo | Línea | Severidad |
|-------|---------|-------|-----------|
| `JWT_SECRET` no definido | `auth/auth.module.ts` | 33 | 🔴 Bloqueante |
| `DATABASE_URL` no definido → `$connect()` | `prisma/prisma.service.ts` | 14, 39 | 🔴 Bloqueante |
| `ts-node` con 18 módulos en Alpine | `scripts/generate-openapi.ts` | 23 | 🟡 Latente |
| `.env` excluido por `.dockerignore` | `.dockerignore` | 3 | 🔴 Bloqueante |

**Recomendación**: El enfoque B (desacoplar `generate:openapi` del build) combinado con A (inyectar dummy vars) es el más seguro y predecible para un entorno CI/CD.

---

## Hallazgos durante la implementación

### H1 — `bootstrap()` como side-effect en `main.ts`
`src/main.ts` llamaba a `bootstrap()` como statement de nivel superior. Cuando `generate-openapi.ts` importaba `buildSwaggerConfig` desde `../src/main`, esto disparaba `bootstrap()` durante la fase de resolución de imports (antes de que las variables de entorno mock entraran en juego).

**Solución**: Guardar `bootstrap()` detrás de `require.main === module` para que solo se ejecute cuando `main.ts` es el entry point.

### H2 — NestJS `ExceptionsZone` traga errores silenciosamente
`@nestjs/core/errors/exceptions-zone.js` envuelve la inicialización del módulo con `DEFAULT_TEARDOWN = () => process.exit(1)`. Cuando un provider falla (ej. `S3Client` factory), NestJS:
1. Loggea el error via `ExceptionHandler.handle()` → `Logger.error()`
2. Llama a `process.exit(1)` directamente
3. Esto impide que cualquier `try/catch` externo capture la excepción

Con `{ logger: false }`, el error se traga sin mostrar mensaje visible. Esta fue la razón por la que el error original solo mostraba "UniconnectLogger inicializado" sin mensaje de error.

### H3 — Se requieren 4 env vars mock (no solo 2)
Además de `JWT_SECRET` y `DATABASE_URL`, `FilesModule` tiene un factory provider para `S3Client` que requiere `AWS_REGION`, y `FilesService` constructor verifica `AWS_S3_BUCKET_NAME`. En total se deben mockear:
- `JWT_SECRET` → `auth.module.ts` y `jwt.strategy.ts`
- `AWS_REGION` → `files.module.ts` (factory) y `files.service.ts` (constructor)
- `AWS_S3_BUCKET_NAME` → `files.service.ts` (constructor)
- `DATABASE_URL` → `prisma.service.ts`

### H4 — Static imports son hoisted, `require()` no
TypeScript `import` statements se resuelven antes que cualquier código a nivel de módulo. Para inyectar env vars antes de la inicialización de NestJS, el script `generate-openapi.ts` debió migrar de `import` estático a `require()` dinámico dentro de la función `generate()`.
