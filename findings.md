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

---

# Findings: AWS Amplify Deploy Failure — Frontend Web

---

## Hallazgo durante implementación del amplify.yml

## Fecha
2026-05-20

## Síntoma
El build de Amplify se detiene tras `npm install` con el mensaje "No backend environment association found". La compilación dura 1m 24s y falla sin generar artefactos.

## Diagnóstico

### 1. No existe `amplify.yml` en el repositorio
```
$ find . -name "amplify.yml"
(no results)
```
Amplify usa configuración por defecto desde la consola. Sin `amplify.yml`, el pipeline no tiene un build command definido explícitamente, y ejecuta `npm install` desde la raíz del monorepo.

### 2. El build corre desde la RAÍZ del monorepo, no desde Frontend/Frontend-web
```
Repo root: /codebuild/output/.../Uniconnect/
npm install → package.json raíz (con workspaces)
```

El `package.json` raíz tiene:
```json
"workspaces": [
  "Frontend/shared",
  "Frontend/Frontend-mobile",
  "Frontend/Frontend-web",
  "packages/api-types"
]
```

Esto significa que `npm install` instala **TODOS** los workspaces, incluyendo React Native, Expo, etc. — innecesario para el web y añade ~1 minuto de build.

### 3. "No backend environment association" — NO es bloqueante
Amplify Backend (el antiguo Amplify CLI) busca una carpeta `amplify/` en la raíz. No existe, así que imprime el warning y continúa. No es la causa del fallo, solo ruido en el log.

### 4. El build se detiene POST npm install
Amplify ejecuta:
```
preBuild: npm install  ← SÍ ejecuta, instala 930+ paquetes
build:    ???           ← No definido → falla o no genera output
```

Sin `amplify.yml`, Amplify no sabe que debe ejecutar:
```bash
cd Frontend/Frontend-web && npm run build
```

### 5. Dependencias locales `file:`
`Frontend/Frontend-web/package.json` referencia:
```json
"@uniconnect/shared": "file:../shared",
"@uniconnect/api-types": "file:../../packages/api-types",
```

Con npm workspaces, estas se resuelven via symlinks en `node_modules/`. Pero si Amplify corre `npm install` desde la raíz y luego intenta `cd Frontend/Frontend-web && npm run build`, los symlinks están rotos porque `npm install` se ejecutó en la raíz, no en el subdirectorio.

### Flujo actual de Amplify (diagrama)

```
Amplify Console
│
├── 1. Clona repositorio → /src/Uniconnect/
│
├── 2. Busca amplify.yml → NO EXISTE
│
├── 3. Backend Build
│   └── Busca carpeta amplify/ → NO EXISTE
│       └── "No backend environment association" (warning)
│
├── 4. Frontend Build
│   ├── preBuild: npm install (desde raíz)
│   │   └── Instala 930+ paquetes (incluye React Native, Expo)
│   └── build: ??? (no definido)
│       └── ❌ FALLA o no produce dist/
│
└── 5. Deploy: No hay artefactos → Error
```

## Raíz del problema

El `package.json` raíz tiene `npm run build:web` que hace `cd Frontend/Frontend-web && npm run build`, pero Amplify no sabe que debe ejecutar ese script. Necesita un `amplify.yml` que:

1. Apunte el `appRoot` o `baseDirectory` a `Frontend/Frontend-web`
2. Defina `preBuild` para construir `@uniconnect/shared` primero
3. Defina `build` como `npm run build` (o `tsc -b && vite build`)

## Archivos relevantes

| Archivo | Ruta |
|---------|------|
| Root package.json (con workspaces) | `package.json` |
| Web package.json | `Frontend/Frontend-web/package.json` |
| Build output dir | `Frontend/Frontend-web/dist/` |
| Amplify config (no existe) | `amplify.yml` |
| Docker alternativo | `Frontend/Frontend-web/Dockerfile` |
| Fly.io config | `Frontend/Frontend-web/fly.toml` |

## Hallazgo durante implementación — TS errors pre-existentes en Frontend-web

Al validar localmente la build del web (`npm run build`), se encontraron **errores de TypeScript pre-existentes** en:

| Archivo | Error |
|---------|-------|
| `ProgramList.tsx:8` | `programs` no existe en `UseQueryResult` |
| `StudentProfile.tsx:120` | Argumento no asignable a `void` |
| `BibliotecaPage.tsx:169` | `url_externa` no existe en `Resource` |
| `EventsPage.tsx:10` | `showToast` declarado pero no usado |
| `EventsPage.tsx:106` | Tipo `CreateEventPayload` vs `CreateEventFormPayload` incompatibles |

Estos 5 errores fueron corregidos en el cambio `fix-frontend-typescript-errors`.

Actualmente quedan **58 errores TypeScript** en el build. Categorizados:

| Categoría | Cantidad | Impacto | Estrategia de bypass |
|-----------|----------|---------|----------------------|
| TS6133: unused declarations | 22 | Bajo — variables/imports no usados | `noUnusedLocals: false` en tsconfig |
| TS2339: property missing | 13 | Medio — bugs reales de tipo | Requiere corregir las interfaces |
| TS2305: testing-library exports | 6 | Bajo — solo en test files | Excluir `__tests__/` del build tsconfig |
| TS2554: argument count mismatch | 3 | Medio — función llamada con args incorrectos | Requiere corregir firmas |
| TS2345: type mismatch | 3 | Medio | Requiere corregir tipos |
| TS2307: module not found | 3 | Alto — rutas rotas `@/src/...` | Corregir paths en imports |
| TS7006: implicit any | 2 | Bajo | Tipar parámetros |
| TS2322: not assignable | 2 | Medio | Corregir tipos |
| Otros | 4 | Variado | — |

**Total: 58 errores**, de los cuales ~28 son triviales (unused declarations + test imports) y ~30 requieren corrección de tipos real.

---

# Análisis CI/CD — Amplify Monorepo Build Chain

## Estado actual del `amplify.yml`

El archivo `amplify.yml` fue creado en el cambio `deploy-frontend-amplify` y está presente en la raíz:

```yaml
version: 1
applications:
  - appRoot: Frontend/Frontend-web
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci --legacy-peer-deps
            - cd ../shared && npm run build
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
```

## Problemas detectados

### P1 — `cd ../shared && npm run build` es probablemente innecesario

El shared package tiene `"main": "src/index.ts"`. Frontend-web importa `@uniconnect/shared` como `file:../shared`, y con `"allowImportingTsExtensions": true` en tsconfig, TypeScript y Vite pueden resolver los `.ts` directamente. El `npm run build` en shared compila a `dist/` pero ese output NO es consumido por el web build.

**Riesgo**: Si el shared package tiene sus propios TS errors, `cd ../shared && npm run build` fallará y detendrá el pipeline antes de llegar al web build.

### P2 — 58 errores TS bloquean `tsc -b`

El build script del web es: `"build": "tsc -b && vite build"`. `tsc -b` (project references) ejecuta type-checking estricto sobre TODO el proyecto incluyendo los 58 errores existentes.

**Solución rápida (recomendada)**: Separar type-checking del build para Amplify:
```json
"build:prod": "vite build",
```
Esto entrega un build sin type-checking. El type-checking sigue disponible localmente via `npm run type-check`.

### P3 — `@uniconnect/api-types` no existe en el entorno de build

`contract-check.ts` importa `@uniconnect/api-types` que está en `packages/api-types/`. Este paquete se genera desde `openapi.json` y no está pre-compilado en el repo. El build falla porque el módulo no existe.

**Solución**: Excluir `contract-check.ts` del build, o añadir un paso `npm run generate:api-types` en preBuild.

### P4 — `@/src/...` paths rotos en GroupAdminStore

`GroupAdminStore.ts` usa `@/src/features/auth/...` — el alias `@/` ya apunta a `src/`, por lo que `@/src/...` es una ruta duplicada. Debería ser `@/features/auth/...`.

## Estrategia recomendada para destrabar el build

```
┌─────────────────────────────────────────────────────────────────┐
│                 ESTRATEGIA EN 3 FASES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FASE 1 (inmediata, ~5 min):                                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ 1. Eliminar tsc -b del build script para Amplify    │       │
│  │ 2. Excluir contract-check.ts del build              │       │
│  │ 3. Quitar cd ../shared && npm run build de preBuild │       │
│  └─────────────────────────────────────────────────────┘       │
│                       ↓                                        │
│  FASE 2 (corto plazo, ~2h):                                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ 1. Corregir ~30 errores de tipo reales              │       │
│  │ 2. Arreglar paths rotos (@/src/...)                  │       │
│  │ 3. Reincorporar tsc -b al build                     │       │
│  └─────────────────────────────────────────────────────┘       │
│                       ↓                                        │
│  FASE 3 (mediano plazo):                                       │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ 1. Configurar Amplify branch-based deployments      │       │
│  │ 2. Agregar pruebas automatizadas pre-deploy         │       │
│  │ 3. Cache optimizations                              │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# Findings: EAS Build Failure — Android APK (Install dependencies phase)

## Fecha
2026-05-20

## Build ID
`e57c0242-258a-440f-91b1-5d83da0934f2`

## Síntoma
EAS Build falla consistentemente en la fase **"Install dependencies"** con:
```
Android build failed: Unknown error. See logs of the Install dependencies build phase for more information.
```

---

## 1. Mapeo de Estructura del Repositorio

```
uniconnect/
├── Frontend/
│   ├── Frontend-mobile/     ✅ Directorio existe
│   ├── Frontend-web/
│   └── shared/
├── packages/
│   └── api-types/
├── package.json              (monorepo root con workspaces)
└── package-lock.json         (monorepo root)
```

**Ruta correcta del proyecto móvil**: `Frontend/Frontend-mobile`

El directorio existe físicamente en el repo. El error `bash: cd: Frontend/Frontend-mobile: No existe el archivo o el directorio` fue un artefacto del shell del usuario (probablemente ejecutado desde un directorio diferente), no un problema estructural real.

---

## 2. Análisis del Archivo eas.json

**Ubicación actual**: `Frontend/Frontend-mobile/eas.json`

```json
{
  "cli": { "version": ">= 18.0.4", "appVersionSource": "remote" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk", "gradleCommand": ":app:assembleRelease" }
    }
  }
}
```

**Problema identificado**: La configuración `build.android.buildType: apk` + `gradleCommand: :app:assembleRelease` es válida, pero **el archivo `eas.json` está en el subdirectorio de la app**, no en la raíz del monorepo. Esto causa que EAS CLI:

1. Detecte el proyecto como una app aislada (no como parte de un monorepo)
2. Suba solo `Frontend/Frontend-mobile` (~1.4 MB) en lugar de todo el workspace
3. Ejecute `npm install` sin acceso a los paquetes hermanos (`@uniconnect/shared`, `@uniconnect/api-types`)

---

## 3. Auditoría de Dependencias (package.json mobile)

```json
"dependencies": {
  "@uniconnect/api-types": "*",
  "@uniconnect/shared": "*"
}
```

**Problema crítico**: Las referencias `"*"` son **workspace dependencies** que requieren el contexto del monorepo (`package.json` raíz con `"workspaces": [...]`). Cuando EAS sube solo el subdirectorio mobile:

- npm no puede resolver `@uniconnect/shared` porque no existe en el registro público
- npm no puede resolver `@uniconnect/api-types` porque no existe en el registro público
- El `package-lock.json` de la raíz no está disponible (EAS no lo sube)

---

## 4. Simulación del Entorno EAS (Reproducción Local)

Al simular el entorno aislado de EAS Build (`/tmp/eas-simulate/Frontend/Frontend-mobile` sin acceso al monorepo):

```bash
npm install
# Resultado: ERESOLVE unable to resolve dependency tree
```

**Error específico**:
```
npm error peer react@"^19.2.6" from react-test-renderer@19.2.6
npm error node_modules/react-test-renderer
npm error   dev react-test-renderer@"^19.1.0" from the root project
npm error   peer react@">=16.0.0" from @testing-library/jest-native@5.4.3
```

**Causa raíz**: `react-test-renderer@19.2.6` tiene un peer dependency de `react@^19.2.6`, pero el proyecto declara `react@19.1.0`. En el monorepo real, esto se resuelve mediante el `package-lock.json` raíz y las configuraciones de `overrides`, pero en el entorno aislado de EAS falla.

---

## 5. Análisis del Commit en EAS

**Commit que EAS está usando**: `2462581f27780efbc3d3df7c4961661b057402ed`

**Estado en repo local**: `Commit NOT found in local repo`

**Implicación**: EAS está construyendo desde un commit que **no existe en nuestro repo local** y que **no incluye los fixes recientes** (commits `7a417da`, `4772820`, etc.). Esto sugiere que:

1. EAS tiene una copia cacheada desactualizada del repositorio
2. O el build fue disparado desde una máquina/rama diferente
3. Los cambios recientes (restauración de `eas.json`, cambio de `file:` a `*`, fix de `metro.config.js`) **no están llegando a EAS Build**

---

## 6. Conclusiones y Root Causes

### 🔴 RC1: EAS no detecta el monorepo
**Causa**: `eas.json` está en `Frontend/Frontend-mobile/` en lugar de la raíz del repo.
**Efecto**: EAS sube solo 1.4 MB (app aislada) y `npm install` falla al no encontrar workspace packages.

### 🔴 RC2: Referencias de dependencias no resolvibles fuera del monorepo
**Causa**: `@uniconnect/shared` y `@uniconnect/api-types` usan `"*"` (workspace refs).
**Efecto**: npm en EAS Build no puede instalar paquetes que no existen en npm registry.

### 🔴 RC3: Peer dependency conflicts sin lockfile
**Causa**: `react-test-renderer@19.2.6` requiere `react@^19.2.6`, proyecto usa `react@19.1.0`.
**Efecto**: Sin `package-lock.json` del monorepo raíz, npm ERESOLVE falla.

### 🔴 RC4: Commit desactualizado en EAS
**Causa**: EAS usa commit `2462581f` que no existe localmente y no tiene los fixes aplicados.
**Efecto**: Los cambios recientes no se reflejan en los builds.

---

## 7. Recomendaciones

1. **Mover `eas.json` a la raíz del monorepo** con configuración de monorepo explicita
2. **Cambiar dependencias `@uniconnect/*` a `file:` paths absolutos o publicar los paquetes**
3. **Asegurar que EAS Build use el commit más reciente de `main`**
4. **Considerar usar `npx eas build --local` para debug antes de enviar a EAS cloud**

---

## Estado
⏳ Pendiente de implementar fix definitivo para EAS monorepo support
