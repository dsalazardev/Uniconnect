# FIX-10: Requisitos - Robust Token Refresh & Graceful Degradation

**Fecha**: 23 de Marzo, 2026  
**Estado**: Especificación de Requisitos  
**Versión**: 1.0.0  
**Clasificación**: Crítico - Autenticación y Sesión

---

## 📋 Resumen Ejecutivo

El sistema frontend experimenta fallos críticos en el ciclo de vida de autenticación cuando el Access Token expira y el servidor de refresh devuelve errores HTTP 5xx. Esto ocasiona:

1. **Peticiones Concurrentes Descontroladas**: El interceptor de Axios genera múltiples llamadas simultáneas a `/auth/refresh`
2. **Bucles Infinitos de Refresco**: Sin límite de reintentos, el cliente entra en estado de espera infinita
3. **Cierre de Sesión Abrupto**: La navegación se interrumpe sin notificación al usuario
4. **Estado Inconsistente**: AuthStore queda en estado indeterminado tras fallos

---

## 🎯 Requisitos Funcionales

### REQ-1: Mecanismo de Mutex para Peticiones de Refresh

**Objetivo**: Evitar peticiones concurrentes al endpoint `/auth/refresh`

**Especificación**:
- Implementar un **lock/mutex** en el interceptor (`src/lib/api.ts`)
- Cuando una petición genera 401 (Unauthorized):
  - Si `isRefreshing === false`: Iniciar el refresco y marcar `isRefreshing = true`
  - Si `isRefreshing === true`: Encolar la petición en `refreshSubscribers` (array de promesas)
- El endpoint de refresh debe ser **inmune al queueing** (no debe reintentarse dentro de la cola)
- Tras completar el refresco (éxito o fallo):
  - Procesar la cola de peticiones pendientes: reintentarlas o rechazarlas
  - Marcar `isRefreshing = false`

**Comportamiento Esperado**:
```
[Petición A] ─► 401 ─► Bloquea, inicia refresh ─► Encolada
[Petición B] ─► 401 ─► Ya refrescando ─► Encolada
[Petición C] ─► 401 ─► Ya refrescando ─► Encolada
[Refresh Token Call] ─► 200 OK ─► Libera cola
[A, B, C] ─► Reintentadas con nuevo token ─► Completadas
```

**Validación**:
- ✓ No hay más de 1 llamada simultánea a `/auth/refresh`
- ✓ Las peticiones encoladas se completan tras refresco exitoso
- ✓ El endpoint `/auth/refresh` no puede estar dentro de `refreshSubscribers`

---

### REQ-2: Manejo Robusto de Errores de Red y Servidor

**Objetivo**: Prevenir bucles infinitos y fallos de sesión cuando el servidor falla

**Especificación**:

#### 2.1 - Manejo de Errores HTTP en Refresh

Definir política de reintentos para el endpoint `/auth/refresh`:

| Código HTTP | Acción | Reintento | Notificación |
|-------------|--------|-----------|--------------|
| 200 | ✓ Éxito | No | Ninguna |
| 400 | ✗ Credenciales inválidas | NO | Logout silencioso |
| 401 | ✗ Token expirado/inválido | NO (máx 1 intento) | Logout silencioso |
| 403 | ✗ Acceso denegado | NO | Logout silencioso |
| 408 | Timeout | Sí (máx 2 reintentos) | Toast: "Conectando..." |
| 429 | Rate limit | Sí (máx 3 reintentos, exponencial backoff) | Toast: "Trop[o] de intentos" |
| 500-599 | Error servidor | Sí (máx 1 intento tras 2s) | Toast: "Error del servidor. Reintentando..." |
| Network Error | Desconexión | Sí (máx 2 reintentos, exponencial backoff) | Toast: "Sin conexión" |

#### 2.2 - Límites de Reintentos

- **Máximo de reintentos globales**: 3 (no incluido el intento inicial)
- **Backoff exponencial**: 1s, 2s, 4s
- **Timeout por solicitud**: 5 segundos (más corto que las peticiones normales)
- **Timeout total**: 10 segundos (suma de todos los intentos)

#### 2.3 - Graceful Degradation

Si el refresco falla **permanentemente** (agotados todos los reintentos):

1. **Limpiar estado**:
   - `AuthStore`: Marcar `isAuthenticated = false`, `tokens = null`
   - API client: Limpiar header `Authorization`
   - Local storage: Mantener tokens (para debugging), pero no usarlos

2. **Notificar al usuario** (Toast con timepo de vida 5 segundos):
   - **Mensaje**: "Tu sesión ha expirado. Por favor inicia sesión nuevamente."
   - **Icono**: ⚠️ Warning
   - **Acción**: Botón "Ir a Login" (opcional, con auto-redirect en 3 segundos)

3. **Redirigir a login**:
   - Router: `router.push('/auth/login')`
   - Preservar ruta actual en query param: `?returnTo=/groups/123` (para reenvío tras login exitoso)
   - **Delay de redirección**: 500ms (permitir que se muestre el Toast)

4. **Descartar cola de peticiones**:
   - Todas las peticiones encoladas se rechazan con error: `"Session expired"`
   - No reintentarlas ni enviarlas al backend

---

### REQ-3: Mejora de Try/Catch en Autenticación

**Objetivo**: Código defensivo en `AuthController` y Auth Store

**Especificación**:

#### 3.1 - AuthController

```typescript
// Cambios esperados en el método refreshTokens()

1. Validar estado previo:
   - ¿Existen tokens en storage?
   - ¿El refresh token no está expirado?

2. Capturar excepciones específicas:
   - TypeError: Errores de parsing JSON (respuesta malformada)
   - AxiosError: Errores HTTP/red
   - Error genérico: Otros errores inesperados

3. Logging detallado:
   - Log errores con contexto: tipo, código, mensaje
   - NO loguear tokens en producción

4. Retornar resultado tipado:
   ```typescript
   type RefreshResult = 
     | { success: true; tokens: TokenPayload }
     | { success: false; code: string; message: string }
   ```

5. Sin throw de excepciones:
   - El AuthStore maneja el resultado
   - El componente visual toma decisiones basado en resultado
```

#### 3.2 - Auth Store (MobX)

```typescript
// Comportamiento esperado en refreshTokens()

1. Antes de llamar refreshTokens():
   - Marcar estado: isRefreshing = true
   
2. Esperar resultado de AuthController:
   - Si success: Actualizar tokens en storage y memoria
   - Si fail:
     a) Log del error con código
     b) Limpiar tokens en memoria
     c) Emitir evento: onSessionExpired
     d) Retornar { success: false }

3. Protección contra concurrent calls:
   - Si isRefreshing === true, retornar promesa pendiente
   - No iniciar segundo refresco
```

---

## 🛡️ Requisitos No-Funcionales

### RNF-1: Tipado Estricto (CERO `any`)

Toda la lógica de refresh debe estar completamente tipada:

```typescript
// ✅ CORRECTO
interface RefreshTokenRequest {
  refreshToken: string;
  deviceId?: string;
}

interface TokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

async function handleRefresh(req: RefreshTokenRequest): Promise<TokenPayload> {
  // ...
}

// ❌ NO PERMITIDO
async function handleRefresh(req: any): Promise<any> {
  // ...
}
```

---

### RNF-2: Performance

- **Overhead de queueing**: < 50ms por petición encolada
- **Latencia de reintento**: Máximo 1 segundo adicional en happy path
- **Memory**: Queue de peticiones debe limpiarse siempre tras completarse

---

### RNF-3: Testing

Cobertura mínima requerida:

| Escenario | Coverage |
|-----------|----------|
| Refresh exitoso + reintento de A | 100% |
| Refresh falla con 500 + logout | 100% |
| Múltiples peticiones encoladas | 100% |
| Timeout en refresh | 100% |
| Network error recovery | 90% |

---

## 📊 Matriz de Trazabilidad

| Req ID | Componente | Archivo | Prioridad |
|--------|-----------|---------|-----------|
| REQ-1 | API Interceptor | `src/lib/api.ts` | 🔴 CRÍTICA |
| REQ-2.1 | Error Handling | `src/lib/api.ts` | 🔴 CRÍTICA |
| REQ-2.3 | UI Notification | `src/features/auth/stores/AuthStore.ts` | 🟠 ALTA |
| REQ-3.1 | Auth Controller | `src/features/auth/controllers/AuthController.ts` | 🔴 CRÍTICA |
| REQ-3.2 | Auth Store | `src/features/auth/stores/AuthStore.ts` | 🔴 CRÍTICA |

---

## 🔍 Criterios de Aceptación

✓ **Mutex Funcional**: Una única llamada a `/auth/refresh` en concurrencia  
✓ **Cola Procesada**: Todas las peticiones encoladas se completan o rechazan  
✓ **Sin Bucles**: Máximo 3 reintentos totales en refresh  
✓ **UX Limpia**: Usuario ve notificación clara sin crashes  
✓ **Logs Detallados**: Auditoría completa de errores sin datos sensibles  
✓ **Tipado 100%**: Cero `any` types en la implementación  
✓ **Tests Passing**: 100% de cobertura en escenarios críticos  

---

## 📝 Notas Arquitectónicas

1. **No modificar Auth0**: El provider externo no cambia. Solo mejora el manejo local.
2. **Retrocompatibilidad**: Los cambios no afectarán el flujo de login inicial.
3. **Storage**: Seguir usando `SecureStore` (Expo) para tokens sensibles.
4. **Observabilidad**: Agregar métricas sobre tasa de 401s y fallos de refresh para monitoreo.

---

**Versión**: 1.0.0  
**Próximo Documento**: `design.md`
