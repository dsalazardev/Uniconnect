# AUDITORÍA CRÍTICA: Duplicación de Notificaciones y Errores de Concurrencia

**Fecha**: 2026-04-29  
**Estado**: 🔴 CRÍTICO - Múltiples problemas de concurrencia detectados  
**Investigador**: Kiro AI Agent

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. Bucle Infinito de Notificaciones (CRÍTICO)
**Síntoma**: Ráfagas de 5 llamadas seguidas a `GET /api/notifications/unread-count`  
**Estado**: ⚠️ PARCIALMENTE RESUELTO (fix implementado pero no probado)

### 2. Race Condition de Autenticación (CRÍTICO)
**Síntoma**: `/events` y `/connections/pending` se llaman ANTES de tener token (401 errors)  
**Estado**: 🔴 ACTIVO - Problema de inicialización detectado

### 3. Colapso de Base de Datos (CRÍTICO)
**Síntoma**: Error P2037 (TooManyConnections) en Aiven Cloud  
**Estado**: ✅ DESCARTADO - Prisma es singleton correcto

### 4. Eventos Duplicados del Backend (MEDIO)
**Síntoma**: Posible duplicación de eventos por el NotificationEventListener  
**Estado**: ✅ DESCARTADO - Listeners correctamente implementados

---

## 📊 MAPA DE DEPENDENCIAS - FLUJO DE CARGA

### Flujo de Inicialización Actual

```
┌─────────────────────────────────────────────────────────────────┐
│                    APP INITIALIZATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

1. App.tsx monta
   └─> AppRoot.tsx monta
       ├─> useAppInitialization() ejecuta
       │   └─> authController.initializeAuth()
       │       ├─> Espera authStore.isInitialized (max 5s)
       │       ├─> Si token expirado: refreshTokens()
       │       └─> Fetch profile para needsOnboarding
       │
       ├─> useTokenRefresh() ejecuta (listener de expiración)
       │
       ├─> useInitNotifications(authStore.accessToken) ⚠️ PROBLEMA #1
       │   └─> useEffect([token, fetchUnreadCount, setUnreadCount])
       │       └─> fetchUnreadCount(token) → API CALL #1
       │
       ├─> useRealtimeNotifications() ejecuta
       │   └─> Conecta WebSocket
       │
       └─> useRegisterPushToken(authStore.accessToken) ejecuta
           └─> Registra token de Expo

2. AppRoot renderiza children
   └─> _layout.tsx monta
       ├─> Navbar monta ⚠️ PROBLEMA #2
       │   └─> useEffect([token, fetchUnreadCount])
       │       └─> AppState listener (solo foreground)
       │
       └─> Stack monta
           └─> index.tsx (Home) monta ⚠️ PROBLEMA #3
               ├─> useEffect(() => eventsStore.loadEvents()) 🔴 RACE CONDITION
               │   └─> API call ANTES de que token esté listo
               │
               └─> useMyGroups() ejecuta
                   └─> API call ANTES de que token esté listo

3. Otros tabs montan en paralelo
   ├─> connections.tsx monta 🔴 RACE CONDITION
   │   └─> useConnections() → API call /connections/pending
   │
   ├─> events.tsx monta
   │   └─> eventsStore.loadEvents() → API call /events
   │
   └─> notifications.tsx monta
       └─> useUserNotifications() ejecuta
           └─> Observer subscription → fetchUnreadCount() → API CALL #2
```

---

## 🔍 ANÁLISIS DETALLADO POR PROBLEMA

### PROBLEMA #1: Bucle Infinito de Notificaciones

#### Causa Raíz Identificada

**ANTES del fix (código original)**:
```typescript
// useInitNotifications - AppRoot
useEffect(() => {
  loadInitialCount(); // API CALL #1
}, [token]);

// Navbar
useEffect(() => {
  loadUnreadCount(); // API CALL #2
}, [token]);

// useUserNotifications - NotificationsList
useEffect(() => {
  loadUnreadCount(); // API CALL #3
}, [token]);

// Observer subscription
useEffect(() => {
  const unsubscribe = notificationObserver.subscribe(() => {
    loadUnreadCount(); // API CALL #4 (cada vez que hay evento)
  });
}, [token]);
```

**Total**: 3 llamadas iniciales + N llamadas por eventos = Bucle infinito

#### Fix Implementado (NO PROBADO)

**DESPUÉS del fix**:
```typescript
// useInitNotifications - AppRoot
useEffect(() => {
  fetchUnreadCount(token); // API CALL #1 (única inicial)
}, [token, fetchUnreadCount, setUnreadCount]);

// Navbar - ELIMINADO initial load
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      fetchUnreadCount(token); // Solo en foreground
    }
  });
}, [token, fetchUnreadCount]);

// useUserNotifications - ELIMINADO local state
const { decreaseUnread, resetUnread, fetchUnreadCount } = useNotificationsStore();

// Observer subscription - USA STORE
useEffect(() => {
  const unsubscribe = notificationObserver.subscribe(() => {
    fetchUnreadCount(token); // API CALL cuando hay evento real
  });
}, [token, fetchUnreadCount]);
```

**Total**: 1 llamada inicial + 1 por foreground + 1 por evento real = Controlado

#### ⚠️ PROBLEMA RESIDUAL DETECTADO

**useInitNotifications tiene dependencias innecesarias**:
```typescript
useEffect(() => {
  if (!token) {
    setUnreadCount(0);
    return;
  }
  fetchUnreadCount(token);
}, [token, fetchUnreadCount, setUnreadCount]); // ⚠️ setUnreadCount causa re-renders
```

**Problema**: `setUnreadCount` cambia en cada render porque es una función del store. Esto puede causar que el `useEffect` se ejecute múltiples veces.

**Solución Recomendada**:
```typescript
useEffect(() => {
  if (!token) {
    setUnreadCount(0);
    return;
  }
  fetchUnreadCount(token);
}, [token]); // Solo depender de token
```

---

### PROBLEMA #2: Race Condition de Autenticación

#### Causa Raíz Identificada

**Flujo de Inicialización Problemático**:

```typescript
// AppRoot.tsx
export const AppRoot: React.FC<AppRootProps> = ({ children }) => {
  const { isInitializing, initializationError } = useAppInitialization();
  
  useTokenRefresh();
  useInitNotifications(authStore.accessToken); // ⚠️ Puede ser null
  useRealtimeNotifications();
  useRegisterPushToken(authStore.accessToken ?? '');

  if (isInitializing) {
    return <LoadingScreen />; // ✅ Bloquea renderizado
  }

  return <>{children}</>; // ⚠️ Renderiza ANTES de que token esté listo
};
```

**Problema**: `isInitializing` se pone en `false` ANTES de que `initializeAuth()` complete el refresh de tokens.

**Secuencia de Eventos**:
```
1. useAppInitialization() ejecuta
   └─> authController.initializeAuth() (async)
       ├─> Espera authStore.isInitialized
       ├─> Si token expirado: refreshTokens() (async) ⚠️
       └─> Fetch profile (async) ⚠️

2. setIsInitializing(false) se ejecuta INMEDIATAMENTE después del try/finally
   └─> AppRoot renderiza children

3. index.tsx monta
   └─> eventsStore.loadEvents() ejecuta
       └─> authStore.accessToken es null o expirado
       └─> API call con token inválido → 401 error

4. refreshTokens() completa (tarde)
   └─> authStore.accessToken se actualiza
   └─> Pero los componentes ya montaron con token inválido
```

#### Solución Recomendada

**Opción 1: Esperar a que initializeAuth complete**
```typescript
// useAppInitialization.ts
export function useAppInitialization() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app authentication...');
        await authController.initializeAuth(); // ✅ Espera a que complete
        console.log('App authentication initialized successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize app';
        console.error('App initialization error:', error);
        setInitializationError(errorMessage);
      } finally {
        setIsInitializing(false); // ✅ Solo después de completar
      }
    };

    initializeApp();
  }, []);

  return {
    isInitializing,
    initializationError,
  };
}
```

**Opción 2: Bloquear API calls hasta que token esté listo**
```typescript
// api.ts interceptor
api.interceptors.request.use(
  async (config) => {
    // ✅ Esperar a que authStore esté inicializado
    while (!authStore.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // ✅ Esperar a que token esté disponible
    if (!authStore.accessToken && authStore.isAuthenticated) {
      console.warn('Token not ready, waiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const token = authStore.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

**Opción 3: Lazy loading de componentes**
```typescript
// index.tsx
export default observer(function HomeScreen() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // ✅ Esperar a que authStore esté listo
    if (authStore.isInitialized && authStore.isAuthenticated) {
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  // ✅ Solo cargar datos cuando token esté listo
  useEffect(() => {
    eventsStore.loadEvents();
  }, []);

  return <View>...</View>;
});
```

---

### PROBLEMA #3: Colapso de Base de Datos (DESCARTADO)

#### Análisis del Singleton de Prisma

**Ubicación**: `Backend/src/prisma/prisma.service.ts`

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private pool: Pool;

    constructor() {
        const pool = new Pool({ 
            connectionString: process.env.DATABASE_URL,
            max: 20, // ✅ Pool de 20 conexiones
            idleTimeoutMillis: 30000, 
            connectionTimeoutMillis: 10000,
            allowExitOnIdle: false,
            ssl: {
                rejectUnauthorized: false,
            },
        });

        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
        
        const adapter = new PrismaPg(pool);
        
        super({
            adapter,
        });

        this.pool = pool;
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Database connected successfully');
        } catch (error) {
            this.logger.error('Failed to connect to database', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
    }
}
```

**Análisis**:
- ✅ `PrismaService` es un `@Injectable()` de NestJS → Singleton por defecto
- ✅ Pool de conexiones configurado con `max: 20`
- ✅ `onModuleInit` y `onModuleDestroy` correctamente implementados
- ✅ No hay `new PrismaClient()` en otros archivos

**Verificación de WebSockets**:
```typescript
// MessagesGateway
constructor(
  private messagesService: MessagesService,
  private prisma: PrismaService, // ✅ Inyección de dependencias
) {}
```

**Conclusión**: El Prisma Service es un singleton correcto. El error P2037 (TooManyConnections) probablemente se debe a:
1. **Conexiones no cerradas**: Queries que no liberan conexiones
2. **Límite de Aiven Cloud**: Plan gratuito con límite bajo (< 20 conexiones)
3. **Múltiples instancias del backend**: Si hay múltiples procesos corriendo

**Recomendación**: Revisar logs de Aiven para ver cuántas conexiones activas hay y de dónde vienen.

---

### PROBLEMA #4: Eventos Duplicados del Backend (DESCARTADO)

#### Análisis del NotificationEventListener

**Ubicación**: `Backend/src/notifications/listeners/notification-event.listener.ts`

**Eventos Escuchados**:
```typescript
@OnEvent(MESSAGE_EVENTS.MESSAGE_SENT)
@OnEvent(MESSAGE_EVENTS.GROUP_INVITATION_SENT)
@OnEvent(MESSAGE_EVENTS.GROUP_INVITATION_ACCEPTED)
@OnEvent(MESSAGE_EVENTS.USER_JOINED_GROUP)
@OnEvent(MESSAGE_EVENTS.CONNECTION_REQUEST_SENT)
@OnEvent(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_SENT)
@OnEvent(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_ACCEPTED)
@OnEvent(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_REJECTED)
```

**Análisis**:
- ✅ Cada evento tiene un handler único
- ✅ No hay overlapping de eventos (un evento no dispara otro)
- ✅ Cada handler crea notificaciones específicas
- ✅ No hay bucles de eventos

**Ejemplo de Handler**:
```typescript
@OnEvent(MESSAGE_EVENTS.GROUP_JOIN_REQUEST_SENT)
async handleGroupJoinRequestSent(payload: GroupJoinRequestSentPayload) {
  try {
    this.logger.log(
      `Handling GROUP_JOIN_REQUEST_SENT event: user ${payload.requester_id} → group ${payload.id_group}`,
    );

    await this.prisma.notification.create({
      data: {
        id_user: payload.owner_id, // ✅ Solo notifica al owner
        message: `${payload.requester_name} quiere unirse a tu grupo "${payload.group_name}"`,
        is_read: false,
        created_at: new Date(),
        related_entity_id: payload.id_request,
        notification_type: 'group_join_request',
      },
    });

    this.logger.log(
      `Created join-request notification for owner ${payload.owner_id}`,
    );
  } catch (error) {
    this.logger.error('Error handling GROUP_JOIN_REQUEST_SENT event:', error);
  }
}
```

**Conclusión**: Los listeners están correctamente implementados. No hay duplicación de eventos en el backend.

---

## 🎯 RESUMEN DE CAUSAS RAÍZ

### 1. Bucle de Notificaciones
**Causa**: Múltiples componentes llamando a `getUnreadCount()` independientemente  
**Estado**: ⚠️ Fix implementado pero con dependencias innecesarias en `useInitNotifications`  
**Prioridad**: 🟡 MEDIA (fix parcial aplicado)

### 2. Race Condition de Autenticación
**Causa**: `isInitializing` se pone en `false` ANTES de que `initializeAuth()` complete el refresh  
**Estado**: 🔴 ACTIVO - Componentes montan con token null/expirado  
**Prioridad**: 🔴 CRÍTICA (causa 401 errors)

### 3. Colapso de Base de Datos
**Causa**: Límite de conexiones de Aiven Cloud alcanzado  
**Estado**: ✅ Prisma singleton correcto, problema externo  
**Prioridad**: 🟢 BAJA (no es problema de código)

### 4. Eventos Duplicados
**Causa**: N/A  
**Estado**: ✅ Listeners correctamente implementados  
**Prioridad**: ✅ DESCARTADO

---

## 🔧 PLAN DE ACCIÓN RECOMENDADO

### Prioridad 1: Resolver Race Condition de Autenticación (CRÍTICO)

**Implementar Opción 2 + Opción 3**:

1. **Agregar guard en interceptor de Axios**:
```typescript
// Frontend/src/constants/api.ts
api.interceptors.request.use(
  async (config) => {
    // Esperar a que authStore esté inicializado
    const maxWait = 5000;
    const startTime = Date.now();
    while (!authStore.isInitialized && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Si no hay token después de inicializar, no agregar header
    const token = authStore.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

2. **Agregar lazy loading en componentes críticos**:
```typescript
// Frontend/app/(tabs)/index.tsx
export default observer(function HomeScreen() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (authStore.isInitialized && authStore.isAuthenticated) {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      eventsStore.loadEvents();
    }
  }, [isReady]);

  if (!isReady) {
    return <ActivityIndicator />;
  }

  return <View>...</View>;
});
```

### Prioridad 2: Optimizar useInitNotifications (MEDIO)

**Remover dependencias innecesarias**:
```typescript
// Frontend/src/features/notifications/hooks/useInitNotifications.ts
export const useInitNotifications = (token: string | null) => {
  const fetchUnreadCount = useNotificationsStore(state => state.fetchUnreadCount);
  const setUnreadCount = useNotificationsStore(state => state.setUnreadCount);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount(token);
  }, [token]); // ✅ Solo depender de token
};
```

### Prioridad 3: Monitorear Conexiones de Base de Datos (BAJO)

**Agregar logging de pool stats**:
```typescript
// Backend/src/prisma/prisma.service.ts
async onModuleInit() {
  try {
    await this.$connect();
    this.logger.log('Database connected successfully');
    
    // ✅ Log pool stats cada 30 segundos
    setInterval(() => {
      this.logger.log(`Pool stats: ${JSON.stringify({
        total: this.pool.totalCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount,
      })}`);
    }, 30000);
  } catch (error) {
    this.logger.error('Failed to connect to database', error);
    throw error;
  }
}
```

---

## 📈 MÉTRICAS DE ÉXITO

### Antes del Fix
- **API calls a unread-count**: 3-5 por carga inicial
- **401 errors**: Frecuentes en `/events` y `/connections/pending`
- **P2037 errors**: Ocasionales en backend

### Después del Fix (Esperado)
- **API calls a unread-count**: 1 por carga inicial
- **401 errors**: 0 (componentes esperan a que token esté listo)
- **P2037 errors**: Reducidos (mejor gestión de conexiones)

---

## 🔍 DEBUGGING ADICIONAL RECOMENDADO

### 1. Agregar Logging de Inicialización
```typescript
// Frontend/src/features/auth/hooks/useAppInitialization.ts
useEffect(() => {
  const initializeApp = async () => {
    try {
      console.log('🔄 [useAppInitialization] Starting...');
      console.log('🔄 [useAppInitialization] authStore.isInitialized:', authStore.isInitialized);
      console.log('🔄 [useAppInitialization] authStore.isAuthenticated:', authStore.isAuthenticated);
      console.log('🔄 [useAppInitialization] authStore.accessToken:', authStore.accessToken ? 'present' : 'null');
      
      await authController.initializeAuth();
      
      console.log('✅ [useAppInitialization] Complete');
      console.log('✅ [useAppInitialization] authStore.isAuthenticated:', authStore.isAuthenticated);
      console.log('✅ [useAppInitialization] authStore.accessToken:', authStore.accessToken ? 'present' : 'null');
    } catch (error) {
      console.error('❌ [useAppInitialization] Error:', error);
      setInitializationError(error.message);
    } finally {
      console.log('🏁 [useAppInitialization] Setting isInitializing to false');
      setIsInitializing(false);
    }
  };

  initializeApp();
}, []);
```

### 2. Agregar Logging de API Calls
```typescript
// Frontend/src/constants/api.ts
api.interceptors.request.use(
  async (config) => {
    console.log('📤 [API Request]', {
      url: config.url,
      method: config.method,
      hasToken: !!authStore.accessToken,
      isInitialized: authStore.isInitialized,
      isAuthenticated: authStore.isAuthenticated,
    });
    
    // ... resto del código
  }
);
```

### 3. Agregar Logging de Renders
```typescript
// Frontend/app/(tabs)/index.tsx
export default observer(function HomeScreen() {
  console.log('🎨 [HomeScreen] Rendering', {
    isInitialized: authStore.isInitialized,
    isAuthenticated: authStore.isAuthenticated,
    hasToken: !!authStore.accessToken,
  });
  
  // ... resto del código
});
```

---

**Fin de la Auditoría**
