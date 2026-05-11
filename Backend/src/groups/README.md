# Módulo de Grupos — Uniconnect Backend

## Patrón State: Ciclo de Vida de Transferencia de Administración

### Descripción

El flujo de transferencia de rol de administrador de grupo implementa el **patrón State (GoF)** con cinco estados concretos e independientes. Cada estado encapsula el comportamiento permitido en ese punto del ciclo de vida y delega las transiciones exclusivamente a través de la interfaz `IEstadoGrupo` vía `IGroupStateContext`.

---

### Diagrama UML — Patrón State

```
┌─────────────────────────────────────────────────────────────────────┐
│                         <<interface>>                               │
│                         IEstadoGrupo                                │
│─────────────────────────────────────────────────────────────────────│
│ + solicitar(ctx: IGroupStateContext, payload: TransferPayload): void │
│ + aceptar(ctx: IGroupStateContext, payload: TransferPayload): void   │
│ + rechazar(ctx: IGroupStateContext, payload: TransferPayload): void  │
│ + transferir(ctx: IGroupStateContext, payload: TransferPayload): void│
│ + getNombre(): string                                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ implements
        ┌────────────────────┼────────────────────────┐
        │                    │                         │
        ▼                    ▼                         ▼
┌──────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ EstadoActivo │  │EstadoPendiente       │  │EstadoTransferencia   │
│              │  │Transferencia         │  │Aceptada              │
│ solicitar()✓ │  │ solicitar() ✗        │  │ (estado terminal)    │
│ aceptar() ✗  │  │ aceptar()  ✓         │  │ solicitar() ✗        │
│ rechazar() ✗ │  │ rechazar() ✓         │  │ aceptar()  ✗         │
│ transferir()✓│  │ transferir()✗        │  │ rechazar() ✗         │
└──────────────┘  └──────────────────────┘  │ transferir()✗        │
        │                    │               └──────────────────────┘
        │         ┌──────────┴────────────┐
        │         │                       │
        ▼         ▼                       ▼
┌──────────────┐  ┌──────────────────────┐
│EstadoDisuelto│  │ EstadoBloqueado       │
│ (terminal)   │  │                      │
│ all() → ✗   │  │ all() → ✗            │
└──────────────┘  └──────────────────────┘


┌──────────────────────────────────────────────────┐
│                GroupStateContext                  │
│──────────────────────────────────────────────────│
│ - currentState: IEstadoGrupo                     │
│ - groupData: GroupData                           │
│ - subject: StudyGroupSubject                     │
│──────────────────────────────────────────────────│
│ + transitionTo(state: IEstadoGrupo): void        │
│ + getState(): IEstadoGrupo                       │
│ + getGroupData(): GroupData                      │
│ + emitEvent(event: StudyGroupEvent): void        │
│ + solicitar(payload): void                       │
│ + aceptar(payload): void                         │
│ + rechazar(payload): void                        │
│ + transferir(payload): void                      │
│ + getNombreEstado(): string                      │
└──────────────────────────────────────────────────┘
```

---

### Diagrama de Transiciones de Estado

```
                    ┌───────────────┐
              ──►   │    Activo     │  ◄─────────────────────┐
                    └───────┬───────┘                         │
                            │                                 │
                   solicitar() ──► ADMIN_TRANSFER_REQUESTED   │
                            │       (Observer notificado)     │
                            ▼                                 │
                    ┌───────────────────────┐                 │
                    │ PendienteTransferencia│                 │
                    └──────┬────────┬───────┘                 │
                           │        │                         │
               aceptar() ──┘        └── rechazar()            │
               ADMIN_TRANSFER_ACCEPTED  ADMIN_TRANSFER_DECLINED│
               (Observer notificado)    (Observer notificado)  │
                           │                                   │
                           ▼                                   │
                    ┌───────────────────────┐             vuelve a Activo
                    │  TransferenciaAceptada│
                    │  (estado terminal)    │
                    └───────────────────────┘

   Desde cualquier estado el sistema puede entrar en:
   ┌──────────────┐     ┌──────────────┐
   │   Disuelto   │     │   Bloqueado  │
   │  (terminal)  │     │  (suspendido)│
   └──────────────┘     └──────────────┘
```

---

### Regla de Diseño Clave

> **Ningún estado concreto referencia directamente a otro estado concreto.**
> Todas las transiciones se realizan llamando a `context.transitionTo(IEstadoGrupo)`,
> donde el contexto recibe la nueva instancia tipada como la interfaz.

```typescript
// ✅ CORRECTO: El estado solo conoce IGroupStateContext e IEstadoGrupo
context.transitionTo(new EstadoPendienteTransferencia()); // typed as IEstadoGrupo

// ❌ PROHIBIDO: Llamar métodos de otro estado concreto directamente
otroEstado.solicitar(...); // viola el patrón
```

---

### Integración con el Patrón Observer

Cuando un estado ejecuta una transición válida, llama a `context.emitEvent(StudyGroupEvent)`, que delega al `StudyGroupSubject`. El Subject notifica a todos los observers suscritos:

| Observer | Comportamiento |
|---|---|
| `WebSocketNotificationObserver` | Emite `study_group_notification` al socket del usuario destino |
| `PersistenceNotificationObserver` | Persiste la notificación en DB + envía push Expo |

El payload del evento incluye `nuevo_estado` con el nombre del estado destino.

---

### Archivos del Módulo State

```
domain/state/
├── interfaces/
│   └── group-state.interface.ts     # IEstadoGrupo, IGroupStateContext, TransferPayload, GroupData
├── context/
│   └── group-state.context.ts       # GroupStateContext (contexto del patrón)
├── states/
│   ├── activo.state.ts              # Estado Activo (estado inicial)
│   ├── pendiente-transferencia.state.ts
│   ├── transferencia-aceptada.state.ts (terminal)
│   ├── disuelto.state.ts            # Estado Disuelto (terminal)
│   └── bloqueado.state.ts           # Estado Bloqueado
├── __tests__/
│   └── group-state.spec.ts          # Tests de todos los estados y transiciones
└── index.ts                         # Barrel exports
```

---

### Integración en GroupsService

El servicio construye un `GroupStateContext` a partir de los datos del grupo obtenidos de DB, determina el estado inicial y delega las validaciones y notificaciones al estado:

```typescript
// Determinar estado inicial según pending_owner_id
const initialState = group.pending_owner_id !== null
  ? new EstadoPendienteTransferencia()
  : new EstadoActivo();

const context = new GroupStateContext(groupData, initialState, this.studyGroupSubject);

// El estado valida precondiciones, transiciona y emite evento al Observer
context.solicitar({ groupId, currentUserId, candidateId, candidateName });

// Persistencia en DB tras validación exitosa (atómica con $transaction donde aplica)
await this.prisma.group.update({ data: { pending_owner_id: candidateId } });
```
