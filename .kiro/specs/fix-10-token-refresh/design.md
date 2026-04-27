# FIX-10: Diseño - Token Refresh Architecture with Queueing

**Fecha**: 23 de Marzo, 2026  
**Estado**: Diseño de Arquitectura  
**Versión**: 1.0.0  
**Autor**: Arquitecto Frontend  

---

## 📐 Resumen Arquitectónico

El sistema de refresh de tokens implementará un **patrón de Interceptor con Queueing** que actúa como "guardián" entre las peticiones HTTP y el servidor. Cuando un token expira, se activa un mecanismo de **mutex** que:

1. Bloquea nuevas peticiones mientras se refresca el token
2. Encola las peticiones pendientes en orden FIFO
3. Una vez actualizado el token, procesa la cola de manera atómica
4. Si el refresco falla, rechaza todas las peticiones con graceful degradation

---

## 🏗️ Componentes Principales

### 1. API Client (`src/lib/api.ts`)

**Responsabilidades**:
- Crear instancia Axios configurada
- Registrar interceptores (request y response)
- Mantener estado de queueing (`isRefreshing`, `refreshSubscribers`)
- Manejar reintentos con exponential backoff

**Estructura interna**:
```typescript
interface ApiClientState {
  isRefreshing: boolean;                           // Flag de bloqueo
  refreshSubscribers: Array<(token: string) => void>;  // Cola de callbacks
  refreshAttempts: number;                         // Contador de reintentos
  lastRefreshTime: number;                         // Para throttling
}

interface RequestConfig {
  skipRefresh?: boolean;                           // Bypass queueing (para /refresh)
  retryCount?: number;                             // Reintentos acumulados
  originalConfig?: AxiosRequestConfig;             // Config original
}
```

---

### 2. Auth Controller (`src/features/auth/controllers/AuthController.ts`)

**Responsabilidades**:
- Encapsular lógica de comunicación con `/auth/refresh`
- Aplicar política de reintentos con backoff
- Validar y parsear respuesta
- Retornar resultado tipado (no lanzar excepciones)

**Métodos**:
```typescript
class AuthController {
  /**
   * Refresca el token de acceso usando el refresh token
   * @param refreshToken - Token de refresco
   * @returns Promesa con resultado tipado
   */
  async refreshTokens(refreshToken: string): Promise<RefreshResult>;
  
  /**
   * Intenta refrescar con reintentos y backoff
   * @private
   */
  private async refreshWithRetries(
    refreshToken: string,
    attempt?: number
  ): Promise<RefreshResult>;
  
  /**
   * Calcula delay exponencial para reintentos
   * @private
   */
  private calculateBackoffDelay(attemptNumber: number): number;
}

type RefreshResult = 
  | { success: true; tokens: { accessToken: string; refreshToken: string } }
  | { success: false; code: RefreshErrorCode; message: string };

type RefreshErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'UNKNOWN';
```

---

### 3. Auth Store (`src/features/auth/stores/AuthStore.ts`)

**Responsabilidades**:
- Mantener estado global de autenticación
- Coordinar refresh con AuthController
- Emitir notificaciones a la UI
- Gestionar limpieza de sesión

**Estado Observable**:
```typescript
class AuthStore {
  // Estado de Autenticación
  @observable isAuthenticated: boolean = false;
  @observable tokens: TokenPayload | null = null;
  @observable currentUser: User | null = null;
  
  // Estado de Operaciones
  @observable isRefreshing: boolean = false;
  @observable lastRefreshTime: number = 0;
  
  // Estado de Errores
  @observable lastError: RefreshError | null = null;
  @observable sessionExpiredNotificationShown: boolean = false;
  
  // Métodos de Acción
  @action async refreshTokens(): Promise<boolean>;
  @action logout(reason?: string): void;
  @action clearSessionExpiredNotification(): void;
}
```

---

## 🔄 Flujos Principales

### Flujo 1: Happy Path - Refresh Exitoso

```
┌─────────────────────────────────────────────────────────────────┐
│ Usuario hace petición HTTP (ejemplo: GET /groups)               │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
       ┌──────────────────────────────┐
       │ Petición enviada con Token A │
       └──────────────┬───────────────┘
                      ↓
       ┌──────────────────────────┐
       │ Server responde: 401      │ (Token expirado)
       └──────────────┬────────────┘
                      ↓
    ┌────────────────────────────────┐
    │ Interceptor Response detecta 401│
    └──────────────┬─────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ ¿isRefreshing === false?         │
    └──────────┬──────────────┬────────┘
         Sí ↓           No    ↓
    ┌────────────────┐  ┌──────────────────────┐
    │ Marcar         │  │ Encolar en           │
    │ isRefreshing   │  │ refreshSubscribers   │
    │ = true         │  │ (esperará resultado) │
    └────────┬───────┘  └──────────────────────┘
             ↓
    ┌──────────────────────────────────┐
    │ Llamar AuthController.refresh()   │
    │ (con timeout: 5s)                │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ Server responde: 200 OK           │
    │ { accessToken: "Token B", ... }   │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ AuthStore.setTokens(Token B)      │
    │ API client header actualizado     │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ Marcar isRefreshing = false       │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ Procesar refreshSubscribers:      │
    │ Ejecutar callbacks pendientes     │
    │ (pasan Token B a cada callback)   │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ GET /groups reintentar con B      │
    │ + Cualquier otra petición encolada│
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ ✅ Peticiones completadas          │
    │ Usuario nunca notó la intermitencia│
    └──────────────────────────────────┘
```

---

### Flujo 2: Degradación Elegante - Refresh Falla (500 Error)

```
┌─────────────────────────────────────────────────────────────────┐
│ Usuario hace petición HTTP (ejemplo: GET /messages)             │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
       ┌──────────────────────────────┐
       │ Petición enviada con Token A │
       └──────────────┬───────────────┘
                      ↓
       ┌──────────────────────────────┐
       │ Server responde: 401          │
       └──────────────┬────────────────┘
                      ↓
    ┌──────────────────────────────────┐
    │ Interceptor: Iniciar refresh      │
    │ isRefreshing = true               │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ AuthController.refresh()          │
    │ POST /auth/refresh {refreshToken} │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ ⚠️ Server responde: 500            │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ Reintentar (backoff: 2s)          │
    │ Intento 2 de 3                    │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ ⚠️ Server responde: 500 (otra vez)│
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ Reintentar (backoff: 4s)          │
    │ Intento 3 de 3 (ÚLTIMO)           │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ ⚠️ Server responde: 500 (again)   │
    │ => Agotados reintentos            │
    └──────────────┬────────────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │ Graceful Degradation ACTIVADO     │
    └──────────────┬────────────────────┘
                   ↓
    ┌─────────────────────────────────────────────────────────────┐
    │ 1. Limpiar Estado:                                           │
    │    - AuthStore.tokens = null                                 │
    │    - AuthStore.isAuthenticated = false                       │
    │    - API client: remover Authorization header                │
    └──────────────┬────────────────────────────────────────────────┘
                   ↓
    ┌─────────────────────────────────────────────────────────────┐
    │ 2. Notificar al Usuario (Toast):                              │
    │    ⚠️ "Tu sesión ha expirado. Por favor inicia sesión."       │
    │    [Ir a Login] (+ auto-dismiss en 5s)                       │
    └──────────────┬────────────────────────────────────────────────┘
                   ↓
    ┌─────────────────────────────────────────────────────────────┐
    │ 3. Rechazar Cola (refreshSubscribers):                       │
    │    Todas las peticiones encoladas → error "Session expired"  │
    │    Limpiar queue                                              │
    └──────────────┬────────────────────────────────────────────────┘
                   ↓
    ┌─────────────────────────────────────────────────────────────┐
    │ 4. Redirigir (con delay de 500ms):                           │
    │    router.push('/auth/login?returnTo=/messages')             │
    └──────────────┬────────────────────────────────────────────────┘
                   ↓
    ┌─────────────────────────────────────────────────────────────┐
    │ ✅ Usuario en pantalla de login limpiamente                   │
    │    (sin crashes, sin bucles infinitos)                        │
    └─────────────────────────────────────────────────────────────┘
```

---

### Flujo 3: Múltiples Peticiones Concurrentes

```
Tiempo →

[Petición A: GET /groups]
    ↓ (401)
    [Mutex ADQUIRIDO]
    [isRefreshing = true]
    [Llamar refresh...]
    
    [Petición B: GET /messages] ← Llega mientras refrescando
        ↓ (401 en timeout)
        [Mutex OCUPADO]
        [Cola A: callback para B]
    
    [Petición C: POST /create-group] ← Llega mientras refrescando
        ↓ (401 en timeout)
        [Mutex OCUPADO]
        [Cola B: callback para C]
    
    [Refresh completado: Token B]
    [Mutex LIBERADO]
    [isRefreshing = false]
    
    [Procesar Cola]:
    [1] Ejecutar callback A → GET /groups con Token B ✓
    [2] Ejecutar callback B → GET /messages con Token B ✓
    [3] Ejecutar callback C → POST /create-group con Token B ✓
    
[Todas las peticiones completadas]
```

---

## 🔌 Integración con Axios

### Request Interceptor

```typescript
// Responsabilidades:
// 1. Agregar Authorization header con token actual
// 2. Marcar originalConfig para identificar en response
// 3. Skip automático para /auth/refresh

api.interceptors.request.use(
  (config) => {
    const token = AuthStore.tokens?.accessToken;
    if (token && !isRefreshEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Response Interceptor

```typescript
// Responsabilidades:
// 1. Detectar 401 y activar mutex
// 2. Guardar originalConfig para reintentar
// 3. Llamar AuthController si isRefreshing === false
// 4. Encolar si isRefreshing === true
// 5. Procesar resultados tras refresh
// 6. Propagar otros errores sin modificar

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;
    
    if (error.response?.status === 401 && !originalConfig.skipRefresh) {
      if (!isRefreshing) {
        // Iniciar refresh
        isRefreshing = true;
        const result = await AuthController.refreshTokens(...);
        if (result.success) {
          // Actualizar API client headers
          // Procesar queue
          refreshSubscribers.forEach(cb => cb(result.tokens.accessToken));
          refreshSubscribers = [];
          
          // Reintentar original request
          return api(originalConfig);
        } else {
          // Graceful degradation
          AuthStore.logout('session_expired');
          return Promise.reject(error);
        }
      } else {
        // Encolar
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((token: string) => {
            originalConfig.headers.Authorization = `Bearer ${token}`;
            api(originalConfig).then(resolve).catch(reject);
          });
        });
      } finally {
        isRefreshing = false;
      }
    }
    
    // Otros errores
    return Promise.reject(error);
  }
);
```

---

## 📊 Estado Compartido (Sincronización)

```
┌─────────────────────────────────────────────────────┐
│                  API Client (api.ts)                │
│                                                     │
│  isRefreshing: boolean ─────┐                       │
│  refreshSubscribers: [] ────┤                       │
│  refreshAttempts: number ───┤                       │
│                             ├─ Mutex Interno       │
└─────────────────────────────────────────────────────┘
                    ↕ (actualización)
┌─────────────────────────────────────────────────────┐
│              Auth Store (MobX Observable)           │
│                                                     │
│  @observable isRefreshing: boolean ────┐            │
│  @observable tokens: TokenPayload ──────┼─ Sincro  │
│  @observable isAuthenticated: boolean ──┤ con UI  │
│  @observable lastError: RefreshError ───┘           │
└─────────────────────────────────────────────────────┘
                    ↕ (observación)
┌─────────────────────────────────────────────────────┐
│               UI Components (React)                 │
│                                                     │
│  - LoginScreen                                      │
│  - GroupList                                        │
│  - MessageList                                      │
│  - Toast (sesión expirada)                          │
└─────────────────────────────────────────────────────┘

SINCRONIZACIÓN:
1. API client detecta 401
2. API client actualiza isRefreshing (local)
3. Auth Store observa cambios vía AuthController
4. Auth Store emite cambios a componentes UI
5. UI refleja estado actualizado
```

---

## 🛡️ Estrategia de UX para Cierres de Sesión

### Caso 1: Refresco Exitoso (Transparente)

**Usuario percibe**: Nada anormal. Petición toma 1-2s adicionales.  
**Notificación**: Ninguna.  
**Logging**: INFO level.

### Caso 2: Refresco con Reintentos (Toast informativo)

**Usuario percibe**: Toast corto (< 3s) diciendo "Reconectando..."  
**Notificación**: Toast (`Toast.show({ message: 'Reconectando...' })`)  
**Logging**: WARN level.

### Caso 3: Refresco Fallido Permanentemente (Logout Forzado)

**Usuario percibe**:
1. Toast: "⚠️ Tu sesión ha expirado. Por favor inicia sesión nuevamente." (5s)
2. Navegación automática a login tras 500ms
3. Preservar intent: query param `returnTo` con ruta anterior

**Notificación**: 
```typescript
Toast.show({
  type: 'danger',
  position: 'top',
  text1: 'Tu sesión ha expirado',
  text2: 'Por favor inicia sesión nuevamente',
  duration: 5000,
  onPress: () => router.push('/auth/login')
});
```

**Logging**: ERROR level con detalles de fallos.

---

## 🔐 Manejo de Errores Específicos

| Error | Causa Probable | Estrategia |
|-------|----------------|-----------|
| **Network Error** | Usuario sin conexión | Reintentar 2x con backoff |
| **Timeout (408)** | Servidor lento | Reintentar 2x con backoff |
| **Rate Limit (429)** | Demasiados requests | Reintentar 3x con backoff exponencial |
| **401** | Refresh token inválido | Logout inmediato |
| **403** | Usuario sin permiso | Logout inmediato + error log |
| **500-599** | Error servidor | Reintentar 1x tras 2s, luego logout |
| **Malformed Response** | Servidor devuelve JSON inválido | Logout inmediato + error log detallado |

---

## 📈 Configuración de Timeouts y Reintentos

```typescript
// TIEMPOS
const REFRESH_TOKEN_TIMEOUT = 5000;      // 5s (más corto)
const REQUEST_TIMEOUT = 10000;           // 10s (normal)
const REDIRECT_TO_LOGIN_DELAY = 500;     // 0.5s
const TOAST_AUTO_DISMISS = 5000;         // 5s

// REINTENTOS
const MAX_REFRESH_ATTEMPTS = 3;          // Total de intentos
const BACKOFF_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

// QUEUEING
const MAX_QUEUED_REQUESTS = 100;         // Protección contra memory leaks
const QUEUE_TIMEOUT = 30000;             // 30s (rechazar si cola pendiente 30s)
```

---

## ✅ Invariantes del Sistema

```typescript
// INVARIANTE 1: Mutex Exclusivo
invariant(!(isRefreshing && activeRefreshRequest), 
  'Solo UN request de refresh activo a la vez');

// INVARIANTE 2: Queue Consistente
invariant(
  isRefreshing === (refreshSubscribers.length > 0),
  'Si isRefreshing=false, no debe haber suscriptores pendientes'
);

// INVARIANTE 3: No Recursión
invariant(
  !isRefreshEndpoint(originalConfig.url),
  'El endpoint /auth/refresh NUNCA debe entrar al interceptor'
);

// INVARIANTE 4: Token Actualizado
invariant(
  AuthStore.tokens !== null || !AuthStore.isAuthenticated,
  'Si isAuthenticated=true, tokens debe existir'
);
```

---

**Versión**: 1.0.0  
**Próximo Documento**: `tasks.md`
