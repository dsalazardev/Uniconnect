# FIX-10: Plan de Implementación - Task Breakdown

**Fecha**: 23 de Marzo, 2026  
**Estado**: Desglose de Tareas  
**Versión**: 1.0.0  
**Épica**: FIX-10: Robust Token Refresh & Graceful Degradation  

---

## 🎯 Resumen Ejecutivo

Plan de ejecución estructurado en **4 Tareas Secuenciales** con subtareas y criterios de aceptación claros. Cada tarea se construye sobre la anterior, garantizando que el sisema completo funcione al final.

---

## 📋 Matriz de Tareas

| ID | Tarea | Prioridad | Estimado | Estado | Bloqueantes |
|---|---|---|---|---|---|
| T-1 | Refactorizar `api.ts` con Mutex/Queue | 🔴 CRÍRICA | 4h | ⏳ Not Started | - |
| T-2 | Implementar Interceptor Response | 🔴 CRÍTICA | 3h | ⏳ Not Started | T-1 |
| T-3 | Mejorar `AuthController.ts` | 🔴 CRÍTICA | 2h | ⏳ Not Started | T-1 |
| T-4 | Validar Logout Limpio | 🟠 ALTA | 2h | ⏳ Not Started | T-2, T-3 |

**Estimado Total**: 11 horas de desarrollo + 2 horas de testing

---

## 🔧 TAREA 1: Refactorizar `src/lib/api.ts` - Mutex y Queue

### Objetivo

Establecer la infraestructura interna del cliente HTTP con capacidad de queueing y control de concurrencia para refresh de tokens.

### Subtareas

#### 1.1 - Definir Tipos e Interfaces

**Archivos afectados**: `src/lib/api.ts`, `src/lib/types/api.types.ts` (crear si no existe)

**Tipos a Definir**:

```typescript
// 1. RefreshSubscriber
type RefreshSubscriber = (accessToken: string) => Promise<AxiosResponse>;

// 2. ApiClientState (interno)
interface ApiClientState {
  isRefreshing: boolean;
  refreshSubscribers: RefreshSubscriber[];
  refreshAttempts: number;
  lastRefreshTime: number;
  lastRefreshError: RefreshError | null;
}

// 3. RefreshError (para logging)
interface RefreshError {
  code: string;
  message: string;
  statusCode?: number;
  timestamp: number;
  originalError?: Error;
}

// 4. ApiClientConfig (configuración)
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  refreshTokenTimeout: number;
  maxRefreshAttempts: number;
  backoffDelays: number[];
}

// 5. RetryableRequest
interface RetryableRequest {
  originalConfig: AxiosRequestConfig;
  attemptCount: number;
  firstAttemptTime: number;
}
```

**Criterio de Aceptación**:
- ✓ Tipos compilados sin errores
- ✓ Cero `any` en definiciones
- ✓ Exportados correctamente desde `api.ts`
- ✓ Documentados con JSDoc

---

#### 1.2 - Crear Estado Interno del API Client

**Archivo**: `src/lib/api.ts`

**Código a Agregar**:

```typescript
// Estado global del API client
const apiState: ApiClientState = {
  isRefreshing: false,
  refreshSubscribers: [],
  refreshAttempts: 0,
  lastRefreshTime: 0,
  lastRefreshError: null
};

// Configuración del cliente
const apiConfig: ApiClientConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  refreshTokenTimeout: 5000,
  maxRefreshAttempts: 3,
  backoffDelays: [1000, 2000, 4000] // 1s, 2s, 4s
};

// Helper: Verificar si una URL es endpoint de refresh
function isRefreshEndpoint(url: string | undefined): boolean {
  return url?.includes('/auth/refresh') ?? false;
}

// Helper: Iniciar contador de reintentos
function initializeRetryState(): RetryableRequest {
  return {
    originalConfig: {},
    attemptCount: 0,
    firstAttemptTime: Date.now()
  };
}

// Helper: Calcular delay de backoff exponencial
function calculateBackoffDelay(attemptNumber: number): number {
  if (attemptNumber < apiConfig.backoffDelays.length) {
    return apiConfig.backoffDelays[attemptNumber];
  }
  return apiConfig.backoffDelays[apiConfig.backoffDelays.length - 1];
}

// Helper: Validar si ya agotó timeout total
function hasExceededTotalTimeout(startTime: number): boolean {
  return Date.now() - startTime > (5 * 1000 + 6 * 1000); // 5s timeout + 6s max backoff
}
```

**Criterio de Aceptación**:
- ✓ Estado inicializado correctamente
- ✓ Helpers testeados aisladamente
- ✓ Configuración centralizada y fácil de modificar
- ✓ Sin efectos secundarios en export de módulo

---

#### 1.3 - Implementar Métodos de Control del Mutex

**Archivo**: `src/lib/api.ts`

**Métodos a Crear**:

```typescript
// LOCKED: Obtener promesa que se resuelve cuando el mutex se libera
function subscribeToTokenRefresh(callback: RefreshSubscriber): Promise<AxiosResponse | null> {
  return new Promise((resolve, reject) => {
    apiState.refreshSubscribers.push(async (token: string) => {
      try {
        const newConfig = { ...originalConfig };
        newConfig.headers.Authorization = `Bearer ${token}`;
        const response = await api(newConfig);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// LOCKED: Procesar todas las peticiones encoladas
async function notifyRefreshSubscribers(accessToken: string): Promise<void> {
  const subscribers = apiState.refreshSubscribers;
  apiState.refreshSubscribers = []; // Limpiar inmediatamente
  
  const promises = subscribers.map(callback => {
    try {
      return callback(accessToken);
    } catch (error) {
      logger.error('Error en subscriber de refresh', error);
      return Promise.reject(error);
    }
  });
  
  try {
    await Promise.allSettled(promises);
  } catch (error) {
    logger.error('Error procesando refresh subscribers', error);
  }
}

// LOCKED: Rechazar todas las peticiones encoladas
async function rejectRefreshSubscribers(error: RefreshError): Promise<void> {
  const subscribers = apiState.refreshSubscribers;
  apiState.refreshSubscribers = []; // Limpiar inmediatamente
  
  subscribers.forEach(callback => {
    try {
      // Rechazar cada callback
      logger.warn(`Rechazando petición encolada por error: ${error.code}`);
    } catch (err) {
      logger.error('Error rechazando subscriber', err);
    }
  });
}

// LOCKED: Reset del estado para testing
function resetApiState(): void {
  apiState.isRefreshing = false;
  apiState.refreshSubscribers = [];
  apiState.refreshAttempts = 0;
  apiState.lastRefreshTime = 0;
  apiState.lastRefreshError = null;
}
```

**Criterio de Aceptación**:
- ✓ Métodos completamente tipados
- ✓ Limpian estado correctamente tras procesamiento
- ✓ Manejo de errores defensivo
- ✓ Logging detallado para debugging

---

### Validación de Tarea 1

```bash
# Test unitarios esperados:
- ✓ apiState inicializa correctamente
- ✓ isRefreshEndpoint() detecta /auth/refresh
- ✓ calculateBackoffDelay() retorna valores correctos
- ✓ subscribeToTokenRefresh() encola callbacks
- ✓ notifyRefreshSubscribers() procesa cola en orden
- ✓ rejectRefreshSubscribers() limpia estado
- ✓ resetApiState() reinicia para testing
```

---

## 🔄 TAREA 2: Implementar Interceptor Response - Token Refresh

### Objetivo

Crear lógica de interceptor que detecte 401, maneje mutex y procese encolamiento.

### Subtareas

#### 2.1 - Crear Interceptor Response Base

**Archivo**: `src/lib/api.ts`

**Estructura**:

```typescript
/**
 * Interceptor de response que maneja 401s y refresh de tokens
 * Flujo:
 * - Si 401 y NO está refrescando: Inicia refresh + encloa resto
 * - Si 401 y YA está refrescando: Encola la petición
 * - Si éxito: Procesa cola
 * - Si fallo: Graceful degradation
 */
api.interceptors.response.use(
  (response) => {
    // Happy path: request exitoso
    return response;
  },
  async (error) => {
    const originalConfig = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Paso 1: Validar que es 401 y no es refresh endpoint
    if (error.response?.status === 401 && !isRefreshEndpoint(originalConfig.url) && !originalConfig._retry) {
      
      originalConfig._retry = true; // Marcar para evitar reintentos infinitos
      
      // Paso 2: ¿Hay un refresh activo?
      if (!apiState.isRefreshing) {
        // Paso 3a: Iniciar refresh (PRIMER REQUEST)
        apiState.isRefreshing = true;
        apiState.refreshAttempts = 0;
        
        try {
          const result = await AuthController.refreshTokens();
          
          if (result.success) {
            // Actualizar token en headers
            originalConfig.headers = originalConfig.headers || {};
            originalConfig.headers.Authorization = `Bearer ${result.tokens.accessToken}`;
            
            // Notificar a todos los subscribers
            await notifyRefreshSubscribers(result.tokens.accessToken);
            
            // Reintentar request original
            return api(originalConfig);
          } else {
            // Fallo en refresh: Graceful degradation
            await rejectRefreshSubscribers(apiState.lastRefreshError!);
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Error inesperado en refresh
          apiState.lastRefreshError = {
            code: 'UNKNOWN_REFRESH_ERROR',
            message: String(refreshError),
            timestamp: Date.now()
          };
          await rejectRefreshSubscribers(apiState.lastRefreshError);
          return Promise.reject(refreshError);
        } finally {
          apiState.isRefreshing = false;
        }
      } else {
        // Paso 3b: YA está refrescando, encolar
        return subscribeToTokenRefresh(async (accessToken: string) => {
          originalConfig.headers = originalConfig.headers || {};
          originalConfig.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalConfig);
        });
      }
    }
    
    // Otros errores: propagar
    return Promise.reject(error);
  }
);
```

**Criterio de Aceptación**:
- ✓ Detecta 401 correctamente
- ✓ No procesa refresh endpoint
- ✓ Marca `_retry` para evitar recursión infinita
- ✓ Sleep cuando `isRefreshing === true`
- ✓ Llama a `AuthController.refreshTokens()`

---

#### 2.2 - Integración con AuthController

**Archivo**: `src/lib/api.ts`

**Requisito**: El interceptor debe importar `AuthController` sin crear dependencia circular.

```typescript
// ✅ CORRECTO: Importar función, no instancia
import { createRefreshTokenRequest } from '@/features/auth/controllers/AuthController';

// En interceptor:
const result = await createRefreshTokenRequest(
  authStore.tokens?.refreshToken!
);
```

**Criterio de Aceptación**:
- ✓ Sin dependencias circulares
- ✓ AuthController retorna `RefreshResult` tipado
- ✓ El interceptor respeta el protocolo de Error/Success

---

#### 2.3 - Error Handling y Logging

**Archivo**: `src/lib/api.ts`

**Requerimientos**:

```typescript
// LOGGING: Cada evento de refresh debe loguarse
logger.info('🔄 Iniciando refresh de token');
logger.debug('Subscribers encolados:', apiState.refreshSubscribers.length);
logger.error('❌ Refresh fallido - Código:', errorCode);

// NO LOGUEAR: Tokens completos, refresh tokens, etc.
// ✅ SI LOGUEAR: Códigos de error, tiempos, intentos
```

**Criterio de Aceptación**:
- ✓ Logging en cada punto clave
- ✓ SIN datos sensibles (tokens)
- ✓ Niveles correctos (info, warn, error)

---

### Validación de Tarea 2

```bash
# Escenarios a validar:
- ✓ 401 → inicia refresh
- ✓ 401 mientras refrescando → encola
- ✓ Refresh 200 → notifica y reintenta
- ✓ Refresh 500 → graceful degradation
- ✓ Multiple 401s → una sola llamada a refresh
- ✓ Sin refresh endpoint en loop
```

---

## 🔐 TAREA 3: Mejorar `src/features/auth/controllers/AuthController.ts`

### Objetivo

Implementar lógica robusta de refresh con reintentos, timeouts y validación tipada.

### Subtareas

#### 3.1 - Refactorizar Método `refreshTokens()`

**Archivo**: `src/features/auth/controllers/AuthController.ts`

**Estructura esperada**:

```typescript
class AuthController {
  /**
   * Refresca el access token usando el refresh token
   * Incluye reintentos con backoff exponencial
   * @param refreshToken - Token de refresco almacenado
   * @returns Promesa con resultado tipado (nunca lanza excepciones)
   */
  async refreshTokens(refreshToken: string): Promise<RefreshResult> {
    try {
      // Validación previa
      if (!refreshToken) {
        return {
          success: false,
          code: 'MISSING_REFRESH_TOKEN',
          message: 'No hay refresh token disponible'
        };
      }
      
      // Llamar a servicio con reintentos
      const result = await this.refreshWithRetries(refreshToken, 0);
      
      if (result.success) {
        logger.info('✅ Token refreshed exitosamente');
        // AuthController NO debe actualizar AuthStore
        // Solo retorna los tokens
        return result;
      } else {
        logger.error('❌ Refresh fallido', result.code);
        return result;
      }
    } catch (error) {
      logger.error('Error inesperado en refreshTokens', error);
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: 'Error inesperado al refrescar token'
      };
    }
  }
  
  /**
   * Reintentar refresh con backoff exponencial
   * @private
   */
  private async refreshWithRetries(
    refreshToken: string,
    attemptNumber: number
  ): Promise<RefreshResult> {
    const maxAttempts = 3;
    const timeout = 5000;
    const backoffDelays = [1000, 2000, 4000];
    
    try {
      // Crear payload tipado
      const payload: RefreshTokenRequest = {
        refreshToken
      };
      
      // Llamar API con timeout
      const response = await Promise.race([
        this.apiService.post<RefreshTokenResponse>(
          '/auth/refresh',
          payload
        ),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('TIMEOUT')),
            timeout
          )
        )
      ]);
      
      // Validar respuesta
      if (!response.data?.accessToken) {
        throw new Error('Respuesta malformada de /auth/refresh');
      }
      
      // Éxito: retornar resultado
      return {
        success: true,
        tokens: {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken || refreshToken
        }
      };
      
    } catch (error) {
      // Evaluar si reintentar
      const errorCode = this.getErrorCode(error);
      const shouldRetry = this.isRetryableError(errorCode, attemptNumber);
      
      if (shouldRetry && attemptNumber < maxAttempts - 1) {
        // Esperar y reintentar
        const delay = backoffDelays[attemptNumber];
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logger.warn(
          `🔄 Reintentando refresh (${attemptNumber + 1}/${maxAttempts})`
        );
        
        return this.refreshWithRetries(refreshToken, attemptNumber + 1);
      } else {
        // Agotados reintentos
        return {
          success: false,
          code: errorCode,
          message: this.getErrorMessage(errorCode)
        };
      }
    }
  }
  
  /**
   * Clasificar código de error basado en tipo de excepción
   * @private
   */
  private getErrorCode(error: unknown): string {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') return 'TIMEOUT';
      if (error.code === 'ECONNREFUSED') return 'NETWORK_ERROR';
      
      const status = error.response?.status;
      if (status === 400) return 'INVALID_CREDENTIALS';
      if (status === 401) return 'TOKEN_EXPIRED';
      if (status === 403) return 'ACCESS_DENIED';
      if (status === 408) return 'TIMEOUT';
      if (status === 429) return 'RATE_LIMITED';
      if (status && status >= 500) return 'SERVER_ERROR';
    }
    
    if (error instanceof Error && error.message === 'TIMEOUT') {
      return 'TIMEOUT';
    }
    
    return 'UNKNOWN_ERROR';
  }
  
  /**
   * Decidir si un error es reintentable
   * @private
   */
  private isRetryableError(errorCode: string, attemptNumber: number): boolean {
    // Errores NO reintentables
    const nonRetryable = [
      'INVALID_CREDENTIALS',
      'TOKEN_EXPIRED',
      'ACCESS_DENIED'
    ];
    
    if (nonRetryable.includes(errorCode)) {
      return false;
    }
    
    // Reintentables: TIMEOUT, NETWORK_ERROR, RATE_LIMITED, SERVER_ERROR
    return attemptNumber < 3;
  }
  
  /**
   * Obtener mensaje de error legible
   * @private
   */
  private getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      'INVALID_CREDENTIALS': 'Credenciales inválidas',
      'TOKEN_EXPIRED': 'Tu sesión ha expirado',
      'ACCESS_DENIED': 'Acceso denegado',
      'TIMEOUT': 'Timeout en petición de refresh',
      'NETWORK_ERROR': 'Error de red',
      'RATE_LIMITED': 'Demasiados intentos. Intenta más tarde.',
      'SERVER_ERROR': 'Error del servidor. Intenta más tarde.',
      'UNKNOWN_ERROR': 'Error desconocido'
    };
    
    return messages[errorCode] || 'Error desconocido';
  }
}
```

**Criterio de Aceptación**:
- ✓ Nunca lanza excepciones (siempre retorna `RefreshResult`)
- ✓ Reintentos con backoff exponencial (1s, 2s, 4s)
- ✓ Timeout por request: 5 segundos
- ✓ Máximo 3 intentos totales
- ✓ Clasificación clara de errores
- ✓ Mensajes legibles para UX
- ✓ Logging detallado sin tokens

---

#### 3.2 - Definir Tipos de Request/Response

**Archivo**: `src/features/auth/types/index.ts`

```typescript
// REQUEST TYPES
export interface RefreshTokenRequest {
  refreshToken: string;
  deviceId?: string; // Opcional si backend lo requiere
}

// RESPONSE TYPES
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string; // Si backend rota también
  expiresIn: number;
}

// RESULT TYPES
export type RefreshResult = 
  | { success: true; tokens: RefreshTokenResponse }
  | { 
      success: false; 
      code: RefreshErrorCode; 
      message: string 
    };

export type RefreshErrorCode = 
  | 'MISSING_REFRESH_TOKEN'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'ACCESS_DENIED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';
```

**Criterio de Aceptación**:
- ✓ Tipos compilados sin errores
- ✓ Discriminated union para `RefreshResult`
- ✓ Sincronizado con backend (API Swagger)

---

### Validación de Tarea 3

```bash
# Tests esperados:
- ✓ refreshTokens() con token válido → éxito
- ✓ refreshTokens() sin token → error MISSING_REFRESH_TOKEN
- ✓ Timeout 5s → error TIMEOUT + reintento
- ✓ 500 Server Error → error SERVER_ERROR + reintento
- ✓ Agotados reintentos → valor de retorno con success: false
- ✓ Nunca lanza excepciones
- ✓ Logging sin tokens sensibles
```

---

## ✅ TAREA 4: Validar Logout Limpio y Graceful Degradation

### Objetivo

Generar tests de integración que validen el flujo completo: fallo de servidor → logout limpio → redirección a login.

### Subtareas

#### 4.1 - Actualizar Auth Store para Graceful Degradation

**Archivo**: `src/features/auth/stores/AuthStore.ts`

**Cambios esperados**:

```typescript
class AuthStore {
  // ... estado existente ...
  
  /**
   * Ejecutar shutdown limpio de sesión
   * Llamado cuando refresh falla permanentemente
   */
  @action
  logout(reason: string = 'user_logout'): void {
    try {
      // 1. Limpiar memoria
      this.tokens = null;
      this.isAuthenticated = false;
      this.currentUser = null;
      this.isRefreshing = false;
      
      // 2. Limpiar Storage
      SecureStore.removeItem('accessToken');
      SecureStore.removeItem('refreshToken');
      
      // 3. Limpiar API client headers
      api.defaults.headers.common.Authorization = undefined;
      
      // 4. Log de auditoría
      logger.info(`🚪 Sesión cerrada. Razón: ${reason}`);
      
      // 5. Evento para componentes UI
      this.onSessionExpired?.(reason);
      
    } catch (error) {
      logger.error('Error durante logout', error);
      // Aún así continuar limpiando
    }
  }
  
  /**
   * Callback que se ejecuta cuando sesión expira
   */
  onSessionExpired?: (reason: string) => void;
}
```

**Criterio de Aceptación**:
- ✓ Limpia estado en memoria y storage
- ✓ Limpia headers de API client
- ✓ Logging de auditoría
- ✓ Callback a componentes UI
- ✓ No lanza excepciones

---

#### 4.2 - Crear Test de Integración E2E

**Archivo**: `src/features/auth/__tests__/token-refresh-failure.e2e.spec.ts`

**Escenarios a cubrir**:

```typescript
describe('Token Refresh - Graceful Degradation E2E', () => {
  
  test('401 → Refresh falla 500 → Logout limpio → Redirección', async () => {
    // 1. Setup: User logueado con token expirado
    const user = await setupAuthenticatedUser();
    const expiredToken = user.accessToken;
    
    // 2. Mock servidor: /groups devuelve 401
    mockAxios.onGet('/groups').reply(401);
    
    // 3. Mock refresh: devuelve 500
    mockAxios.onPost('/auth/refresh').reply(500);
    
    // 4. Trigger: Petición a /groups
    const promise = api.get('/groups');
    
    // 5. Assert: Logout fue llamado
    await waitFor(() => {
      expect(AuthStore.isAuthenticated).toBe(false);
      expect(AuthStore.tokens).toBeNull();
    });
    
    // 6. Assert: Toast notificó al usuario
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: 'Tu sesión ha expirado'
      })
    );
    
    // 7. Assert: Router redirigió a login
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/auth/login');
    });
  });
  
  test('Múltiples 401s → Una sola llamada a /auth/refresh', async () => {
    // Setup
    mockAxios.onPost('/auth/refresh').reply(200, {
      accessToken: 'NEW_TOKEN'
    });
    
    // 3 peticiones simultáneas que fallan con 401
    mockAxios.onGet('/groups').reply(401);
    mockAxios.onGet('/messages').reply(401);
    mockAxios.onGet('/events').reply(401);
    
    // Disparar 3 peticiones
    const p1 = api.get('/groups');
    const p2 = api.get('/messages');
    const p3 = api.get('/events');
    
    // Assert: /auth/refresh solo fue llamado UNA VEZ
    await waitFor(() => {
      const refreshCalls = mockAxios.history.post.filter(
        req => req.url === '/auth/refresh'
      );
      expect(refreshCalls).toHaveLength(1);
    });
  });
  
  test('Timeout en refresh → Reintenta → Falla → Logout', async () => {
    // Mock: Timeout en primer intento
    let callCount = 0;
    mockAxios.onPost('/auth/refresh').reply(() => {
      callCount++;
      if (callCount < 2) {
        return new Promise(() => {}); // Never resolves = timeout
      }
      return [500]; // Segundo intento: error
    });
    
    // Trigger 401
    mockAxios.onGet('/groups').reply(401);
    api.get('/groups');
    
    // Assert: Reintentó y eventualmente hizo logout
    await waitFor(() => {
      expect(AuthStore.isAuthenticated).toBe(false);
    }, { timeout: 15000 }); // Esperar reintentos
  });
});
```

**Criterio de Aceptación**:
- ✓ E2E tests pasan sin errores
- ✓ Logout se ejecuta en escenarios fallo
- ✓ UI se notifica correctamente
- ✓ Redirection funcionan
- ✓ Mutex evita múltiples refresh calls

---

#### 4.3 - Crear Tests de Propiedades (Property-Based Testing)

**Archivo**: `src/features/auth/__tests__/token-refresh.property.spec.ts`

**Usar Fast-Check para validar invariantes**:

```typescript
import fc from 'fast-check';

describe('Token Refresh - Property-Based Tests', () => {
  
  test('Invariante: Máximo 1 refresh activo nunca se viola', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(), { maxLength: 100 }),
        async (requestIndices) => {
          resetApiState();
          
          // Disparar múltiples requests concurrentes
          const promises = requestIndices.map(() => 
            api.get('/some-endpoint')
          );
          
          try {
            await Promise.allSettled(promises);
          } catch {
            // Ignorar errores, solo validar invariante
          }
          
          // Validar: nunca hubo más de 1 refresh simultáneo
          expect(apiState.isRefreshing).toBe(false);
          expect(apiState.refreshSubscribers.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Invariante: RefreshSubscribers limpiados tras procesamiento', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 20 }),
        async (tokenIds) => {
          resetApiState();
          
          // Agregar múltiples suscriptores
          tokenIds.forEach(() => {
            apiState.refreshSubscribers.push(async (token) => {
              return Promise.resolve();
            });
          });
          
          // Procesar cola
          await notifyRefreshSubscribers('NEW_TOKEN');
          
          // Validación: Queue vacía siempre
          expect(apiState.refreshSubscribers.length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

**Criterio de Aceptación**:
- ✓ 50-100 ejecuciones property-based sin fallos
- ✓ Invariantes validadas
- ✓ Memoria liberada correctamente

---

### Validación de Tarea 4

```bash
# Validar:
- ✓ E2E tests: 401 → 500 → logout → redirección
- ✓ Mutex: múltiples 401s → 1 refresh
- ✓ Timeout handling: reintenta y eventualmente logout
- ✓ Property tests: invariantes nunca violadas
- ✓ Memory: Sin memory leaks tras procesamiento
```

---

## 📊 Matriz de Dependencias

```
┌─────────────┐
│   T-1       │ Definir tipos e interfaces
│  Refactor   │ Crear estado interno
│  api.ts     │ Métodos de mutex
└──────┬──────┘
       │
       ├─────────────┐
       │             │
   ┌───▼────┐   ┌───▼────────┐
   │  T-2   │   │    T-3     │
   │Interceptor  │ AuthCtrl   │
   │Response │   │ Refactor   │
   └───┬────┘   └───┬────────┘
       │            │
       └──────┬─────┘
              │
          ┌───▼────┐
          │  T-4   │
          │Validar │
          │ Logout │
          └────────┘
```

---

## ⏱️ Estimación de Tiempo

| Tarea | Subtareas | Estimado | Incluye Testing |
|-------|-----------|----------|-----------------|
| T-1 | 3 | 4 horas | Unitarios básicos |
| T-2 | 3 | 3 horas | Unitarios avanzados |
| T-3 | 2 | 2 horas | Unitarios + mocks |
| T-4 | 3 | 2 horas | E2E + Property-based |
| **Total** | **11** | **11 horas** | **Cobertura ~90%** |

---

## 🎯 Definición de "Listo para Producción"

**Requisitos previos al Merge a `main`:**

- ✅ Todas las tareas completadas (T-1, T-2, T-3, T-4)
- ✅ 100% de cobertura de tests en archivos modificados
- ✅ Cero `any` types
- ✅ Code Review aprobado (2 reviewers)
- ✅ E2E tests pasando en CI/CD
- ✅ Performance: No más de 50ms overhead en happy path
- ✅ Memory: Sin leaks después de 100 ciclos de refresh
- ✅ Documentación actualizada en AGENTS.md

---

## 📝 Checklist de Ejecución

Marcar a medida que se completa cada subtarea:

### T-1: Refactorizar `api.ts`
- [ ] 1.1 Definir tipos e interfaces
- [ ] 1.2 Estado interno del API client
- [ ] 1.3 Métodos de control del mutex
- [ ] ✅ Validación de T-1

### T-2: Interceptor Response
- [ ] 2.1 Crear interceptor response base
- [ ] 2.2 Integración con AuthController
- [ ] 2.3 Error handling y logging
- [ ] ✅ Validación de T-2

### T-3: Mejorar AuthController
- [ ] 3.1 Refactorizar `refreshTokens()`
- [ ] 3.2 Definir tipos de request/response
- [ ] ✅ Validación de T-3

### T-4: Validar Logout Limpio
- [ ] 4.1 Actualizar Auth Store
- [ ] 4.2 Tests E2E
- [ ] 4.3 Property-based tests
- [ ] ✅ Validación de T-4

---

**Versión**: 1.0.0  
**Estado**: Listo para Implementación  
**Próximo Paso**: Iniciar Tarea T-1
