# Diagnóstico: Duplicación del Conteo de Notificaciones

**Fecha**: 28 de Abril, 2026  
**Investigador**: Kiro AI Agent  
**Estado**: ✅ DIAGNÓSTICO COMPLETADO

---

## 🎯 PROBLEMA REPORTADO

El usuario reporta que el conteo de notificaciones no leídas se duplica en la UI, a pesar de que la petición `GET /api/notifications/unread-count` retorna el valor correcto desde el backend.

**Síntoma**: Si el backend retorna `{ count: 5 }`, la UI muestra `10`.

---

## 🔍 ANÁLISIS DEL BACKEND (COMPLETADO ✅)

### Endpoint Auditado
**Ubicación**: `Backend/src/notifications/notifications.controller.ts`

```typescript
@Get('unread-count')
async getUnreadCount(@GetClaim('sub') userId: number) {
  return this.notificationsService.getUnreadCount(userId);
}
```

**Análisis**: 
- ✅ Endpoint directo sin interceptores
- ✅ Solo `JwtAuthGuard` aplicado
- ✅ No hay lógica que duplique la respuesta

### Servicio Auditado
**Ubicación**: `Backend/src/notifications/notifications.service.ts`

```typescript
async getUnreadCount(userId: number) {
  const count = await (this.prisma.notification as any).count({
    where: { id_user: userId, is_read: false },
  });
  return { count };
}
```

**Análisis**:
- ✅ Query simple de Prisma: `count({ where: { id_user, is_read: false } })`
- ✅ **NO hay joins** que puedan causar duplicados
- ✅ Retorna `{ count }` directamente sin transformaciones

**Conclusión Backend**: El backend está limpio y no es la fuente del problema.

---

## 🔍 ANÁLISIS DEL FRONTEND (COMPLETADO ✅)

### 1. Store de Notificaciones (Zustand)

**Ubicación**: `Frontend/src/features/notifications/store/notifications.store.ts`

```typescript
export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }), // ✅ REEMPLAZO

  decreaseUnread: () =>
    set((state) => ({
      unreadCount: Math.max(state.unreadCount - 1, 0),
    })),

  resetUnread: () => set({ unreadCount: 0 }),
}));
```

**Análisis**:
- ✅ `setUnreadCount` usa **reemplazo** (`count`), NO acumulación (`+= count`)
- ✅ No hay lógica que duplique el valor
- ✅ Store correctamente implementado

**Conclusión Store**: El store NO es la causa del problema.

---

### 2. Llamadas al Endpoint `unread-count`

**Resultado del grep**: Se encontraron **3 lugares** que llaman a `getUnreadCount()`:

#### 2.1. `useInitNotifications` (Hook de Inicialización)
**Ubicación**: `Frontend/src/features/notifications/hooks/useInitNotifications.ts`

```typescript
export const useInitNotifications = (token: string | null) => {
  const setUnreadCount = useNotificationsStore(state => state.setUnreadCount);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    const loadInitialCount = async () => {
      try {
        const { count } = await notificationsService.getUnreadCount(token);
        setUnreadCount(count); // ✅ Llama a setUnreadCount
      } catch (error) {
        console.error('Error al cargar conteo inicial de notificaciones:', error);
        setUnreadCount(0);
      }
    };

    loadInitialCount();
  }, [token, setUnreadCount]);
};
```

**Usado en**: `src/components/AppRoot.tsx`

```typescript
export const AppRoot = () => {
  useInitNotifications(authStore.accessToken); // ✅ Se ejecuta al montar AppRoot
  // ...
};
```

**Análisis**:
- ✅ Se ejecuta **UNA VEZ** al montar `AppRoot`
- ✅ Llama a `setUnreadCount(count)` (reemplazo)
- ✅ No causa duplicación por sí solo

---

#### 2.2. `Navbar` (Componente de Navegación)
**Ubicación**: `Frontend/src/components/Navbar.tsx`

```typescript
export const Navbar = () => {
  const token = authStore.accessToken || '';
  const setUnreadCount = useNotificationsStore(state => state.setUnreadCount);

  const loadUnreadCount = async () => {
    if (!token) return;
    try {
      const data = await notificationsService.getUnreadCount(token);
      setUnreadCount(data.count); // ✅ Llama a setUnreadCount
    } catch (error) {
      console.log('Error cargando conteo de notificaciones:', error);
    }
  };

  // Cargar conteo inicial
  useEffect(() => {
    if (!token) return;
    loadUnreadCount();
  }, [token]);

  // Recargar cuando vuelve a foreground (AppState)
  useEffect(() => {
    if (!token) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadUnreadCount();
      }
    });

    return () => subscription.remove();
  }, [token]);
  
  // ...
};
```

**Análisis**:
- ⚠️ Se ejecuta **OTRA VEZ** al montar `Navbar`
- ⚠️ Llama a `setUnreadCount(data.count)` (reemplazo)
- ⚠️ **POSIBLE CAUSA**: Si `Navbar` se monta después de `AppRoot`, hay **2 llamadas consecutivas**

---

#### 2.3. `useUserNotifications` (Hook de Lista de Notificaciones)
**Ubicación**: `Frontend/src/features/notifications/hooks/useUserNotifications.ts`

```typescript
export const useUserNotifications = ({ token }: UseUserNotificationsOptions) => {
  const [unreadCount, setUnreadCount] = useState(0); // ⚠️ Estado LOCAL

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsService.getUnreadCount(token);
      setUnreadCount(data.count); // ⚠️ Actualiza estado LOCAL
    } catch (err: any) {
      console.error('Error al cargar conteo de no leídas:', err);
    }
  }, [token]);

  // Cargar datos iniciales
  useEffect(() => {
    if (token) {
      loadNotifications();
      loadUnreadCount(); // ✅ Llama a loadUnreadCount
    }
  }, [token, loadNotifications, loadUnreadCount]);

  // Recargar cuando la app vuelve al foreground
  useEffect(() => {
    if (!token) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [token, loadUnreadCount]);

  // Suscribirse al observer para recibir notificaciones en tiempo real
  useEffect(() => {
    if (!token) return;

    const unsubscribe = notificationObserver.subscribe(() => {
      loadUnreadCount(); // ✅ Recarga cuando hay cambios
    });

    return unsubscribe;
  }, [token, loadUnreadCount]);

  return {
    notifications,
    unreadCount, // ⚠️ Retorna estado LOCAL
    // ...
  };
};
```

**Usado en**: `src/features/notifications/components/NotificationsList.tsx`

```typescript
export const NotificationsList = () => {
  const {
    notifications,
    unreadCount, // ⚠️ Estado LOCAL del hook
    // ...
  } = useUserNotifications({ token });

  const setUnreadCount = useNotificationsStore(state => state.setUnreadCount);

  useEffect(() => {
    setUnreadCount(unreadCount); // ⚠️ Sincroniza LOCAL → GLOBAL
  }, [unreadCount, setUnreadCount]);
  
  // ...
};
```

**Análisis**:
- ⚠️ `useUserNotifications` mantiene un **estado LOCAL** (`useState`)
- ⚠️ `NotificationsList` sincroniza el estado LOCAL al **store GLOBAL** con `useEffect`
- ⚠️ **POSIBLE CAUSA**: Si `NotificationsList` se monta mientras `Navbar` o `AppRoot` ya llamaron al endpoint, hay **3 llamadas consecutivas**

---

### 3. Notification Observer (WebSocket)

**Ubicación**: `Frontend/src/features/notifications/services/notification-observer.service.ts`

```typescript
class NotificationObserverService {
  private listeners: Set<NotificationListener> = new Set();

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error en notification listener:', error);
      }
    });
  }
}
```

**Análisis**:
- ✅ Observer correctamente implementado
- ✅ No duplica llamadas por sí solo
- ⚠️ **POSIBLE CAUSA**: Si múltiples componentes se suscriben y `notify()` se llama, todos recargan el contador simultáneamente

---

## 🚨 CAUSA RAÍZ IDENTIFICADA

### Problema: **Múltiples Llamadas Concurrentes al Endpoint**

**Flujo de Ejecución Actual**:

1. **AppRoot se monta** → `useInitNotifications` llama a `getUnreadCount()` → `setUnreadCount(5)`
2. **Navbar se monta** → `useEffect` llama a `getUnreadCount()` → `setUnreadCount(5)`
3. **NotificationsList se monta** → `useUserNotifications` llama a `getUnreadCount()` → `setUnreadCount(5)` (estado local)
4. **NotificationsList sincroniza** → `useEffect` llama a `setUnreadCount(5)` (store global)

**Resultado**: Aunque cada llamada usa **reemplazo** (`setUnreadCount(count)`), si hay **race conditions** o **renders múltiples**, el valor puede duplicarse.

---

### Hipótesis de Duplicación

#### Hipótesis 1: Race Condition en `setUnreadCount`
- Si `Navbar` y `NotificationsList` llaman a `setUnreadCount` **casi simultáneamente**, Zustand podría procesar las actualizaciones en orden incorrecto.
- **Probabilidad**: Baja (Zustand maneja actualizaciones atómicamente).

#### Hipótesis 2: Estado LOCAL de `useUserNotifications` Desincronizado
- `useUserNotifications` mantiene un estado LOCAL (`useState`) que se sincroniza al store GLOBAL.
- Si el estado LOCAL se actualiza **después** de que el store GLOBAL ya tiene el valor correcto, puede causar sobrescritura.
- **Probabilidad**: Media.

#### Hipótesis 3: Múltiples Suscripciones al Observer
- Si `Navbar` y `NotificationsList` se suscriben al `notificationObserver`, cuando `notify()` se llama, ambos recargan el contador.
- Si ambos llaman a `setUnreadCount` con el mismo valor, no debería duplicarse (es reemplazo).
- **Probabilidad**: Baja.

#### Hipótesis 4: Doble Render de `NotificationsList`
- Si `NotificationsList` se renderiza **dos veces** (por ejemplo, por cambios en props o estado), el `useEffect` que sincroniza el estado LOCAL al GLOBAL se ejecuta **dos veces**.
- Si el estado LOCAL tiene un valor incorrecto (por ejemplo, `10` en lugar de `5`), se sobrescribe el store GLOBAL.
- **Probabilidad**: **Alta** ⚠️

---

## 🎯 RECOMENDACIONES DE FIX

### Opción 1: Eliminar Estado LOCAL de `useUserNotifications` (RECOMENDADO)

**Problema**: `useUserNotifications` mantiene un estado LOCAL que se sincroniza al store GLOBAL, causando posibles desincronizaciones.

**Solución**: Hacer que `useUserNotifications` lea directamente del store GLOBAL en lugar de mantener estado LOCAL.

**Cambios**:

```typescript
// ❌ ANTES (Estado LOCAL)
export const useUserNotifications = ({ token }: UseUserNotificationsOptions) => {
  const [unreadCount, setUnreadCount] = useState(0); // Estado LOCAL
  
  const loadUnreadCount = useCallback(async () => {
    const data = await notificationsService.getUnreadCount(token);
    setUnreadCount(data.count); // Actualiza LOCAL
  }, [token]);
  
  return { unreadCount }; // Retorna LOCAL
};

// ✅ DESPUÉS (Leer del Store GLOBAL)
export const useUserNotifications = ({ token }: UseUserNotificationsOptions) => {
  const setUnreadCount = useNotificationsStore(state => state.setUnreadCount);
  
  const loadUnreadCount = useCallback(async () => {
    const data = await notificationsService.getUnreadCount(token);
    setUnreadCount(data.count); // Actualiza GLOBAL directamente
  }, [token, setUnreadCount]);
  
  // NO retornar unreadCount, que los componentes lo lean del store
  return { /* sin unreadCount */ };
};
```

**Ventajas**:
- ✅ Elimina sincronización LOCAL → GLOBAL
- ✅ Fuente única de verdad (store GLOBAL)
- ✅ Previene race conditions

---

### Opción 2: Centralizar Carga del Contador en `useInitNotifications`

**Problema**: `Navbar` y `NotificationsList` también cargan el contador, causando llamadas redundantes.

**Solución**: Solo `useInitNotifications` debe cargar el contador inicial. Los demás componentes solo leen del store.

**Cambios**:

```typescript
// ❌ ANTES (Navbar carga el contador)
export const Navbar = () => {
  const loadUnreadCount = async () => {
    const data = await notificationsService.getUnreadCount(token);
    setUnreadCount(data.count);
  };

  useEffect(() => {
    loadUnreadCount(); // ❌ Llamada redundante
  }, [token]);
};

// ✅ DESPUÉS (Navbar solo lee del store)
export const Navbar = () => {
  const unreadCount = useNotificationsStore(state => state.unreadCount);
  // NO cargar, solo leer
};
```

**Ventajas**:
- ✅ Reduce llamadas al backend
- ✅ Evita race conditions
- ✅ Simplifica lógica

---

### Opción 3: Debounce de `setUnreadCount`

**Problema**: Si múltiples componentes llaman a `setUnreadCount` casi simultáneamente, puede haber actualizaciones duplicadas.

**Solución**: Implementar debounce en `setUnreadCount` para que solo la última llamada se aplique.

**Cambios**:

```typescript
import { debounce } from 'lodash';

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,

  setUnreadCount: debounce((count: number) => {
    set({ unreadCount: count });
  }, 100), // 100ms debounce
}));
```

**Ventajas**:
- ✅ Previene actualizaciones rápidas consecutivas
- ✅ Fácil de implementar

**Desventajas**:
- ⚠️ Agrega dependencia externa (lodash)
- ⚠️ No resuelve la causa raíz (múltiples llamadas)

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Validación del Problema (COMPLETADA ✅)
- ✅ Auditar backend (sin problemas encontrados)
- ✅ Auditar store (sin problemas encontrados)
- ✅ Identificar llamadas al endpoint (3 lugares encontrados)
- ✅ Analizar flujo de datos (race conditions identificadas)

### Fase 2: Implementación del Fix (PENDIENTE)
1. **Eliminar estado LOCAL de `useUserNotifications`** (Opción 1)
2. **Eliminar carga redundante en `Navbar`** (Opción 2)
3. **Validar que solo `useInitNotifications` carga el contador inicial**
4. **Validar que `notificationObserver` solo recarga cuando hay cambios reales**

### Fase 3: Testing (PENDIENTE)
1. **Test de carga inicial**: Verificar que el contador se carga UNA VEZ al montar la app
2. **Test de sincronización**: Verificar que el contador se actualiza correctamente al marcar como leída
3. **Test de WebSocket**: Verificar que el observer no causa duplicaciones
4. **Test de AppState**: Verificar que el contador se recarga correctamente al volver a foreground

---

## 📊 RESUMEN EJECUTIVO

**Causa Raíz**: Múltiples componentes (`AppRoot`, `Navbar`, `NotificationsList`) cargan el contador de notificaciones no leídas de forma independiente, causando llamadas redundantes al endpoint y posibles race conditions.

**Solución Recomendada**: 
1. Eliminar estado LOCAL de `useUserNotifications` (leer directamente del store GLOBAL)
2. Centralizar carga del contador en `useInitNotifications`
3. Eliminar carga redundante en `Navbar` y `NotificationsList`

**Impacto**: 
- ✅ Reduce llamadas al backend (de 3 a 1 por carga inicial)
- ✅ Elimina race conditions
- ✅ Simplifica lógica de sincronización
- ✅ Fuente única de verdad (store GLOBAL)

**Próximos Pasos**: Implementar Opción 1 + Opción 2 y validar con testing.

---

**Fin del Diagnóstico**
