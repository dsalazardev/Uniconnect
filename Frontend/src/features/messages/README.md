# Sistema de Mensajería en Tiempo Real - Uniconnect

## 📋 Descripción

Sistema completo de chat en tiempo real con WebSockets, gestión de grupos de estudio e invitaciones. Incluye persistencia de mensajes, notificaciones automáticas y arquitectura escalable.

## 🚀 Características Implementadas

- ✅ Chat en tiempo real con WebSockets (Socket.io)
- ✅ Persistencia de mensajes (no se pierden al cerrar sesión)
- ✅ Edición y eliminación de mensajes con permisos
- ✅ Indicador de "usuario escribiendo..."
- ✅ Scroll infinito con paginación
- ✅ Búsqueda de mensajes en grupos
- ✅ Reconexión automática de WebSocket
- ✅ Gestión completa de grupos de estudio
- ✅ Sistema de invitaciones separado de conexiones
- ✅ Notificaciones automáticas en tiempo real
- ✅ Validaciones de negocio (límite de 3 grupos por materia)

## 📁 Estructura de Archivos

```
src/features/messages/
├── api/
│   ├── endpoints.ts          # URLs de los endpoints REST
│   └── index.ts
├── services/
│   ├── websocket.service.ts  # Servicio singleton de WebSocket
│   ├── messages.service.ts   # Servicio REST de mensajes
│   └── index.ts
├── hooks/
│   ├── useChat.ts            # Hook principal para chat
│   └── index.ts
├── components/
│   ├── MessageBubble.tsx     # Componente de burbuja de mensaje
│   ├── ChatScreen.tsx        # Pantalla completa de chat
│   └── index.ts
├── types/
│   └── index.ts              # TypeScript types completos
└── index.ts
```

## 🔧 Uso Básico

### 1. Implementar Chat en una Pantalla

```tsx
import React from 'react';
import { ChatScreen } from '@/src/features/messages';
import { useAuth } from '@/src/features/auth'; // Tu hook de auth

export default function GroupChatScreen({ route }) {
  const { groupId, membershipId, isAdmin } = route.params;
  const { user, token } = useAuth();

  return (
    <ChatScreen
      groupId={groupId}
      userId={user.id_user}
      membershipId={membershipId}
      token={token}
      isAdmin={isAdmin}
      userFullName={user.full_name}
      serverUrl="http://localhost:3000" // URL de tu backend
    />
  );
}
```

### 2. Usar Hook de Chat Personalizado

```tsx
import { useChat } from '@/src/features/messages';

function MiComponenteChat() {
  const {
    messages,
    loading,
    error,
    isConnected,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    emitTyping,
  } = useChat({
    groupId: 1,
    userId: 10,
    membershipId: 15,
    token: 'tu-jwt-token',
    serverUrl: 'http://localhost:3000',
  });

  const handleSend = () => {
    sendMessage('Hola grupo!');
  };

  return (
    // Tu UI personalizada
  );
}
```

### 3. Gestión de Grupos

```tsx
import { useMyGroups, useDiscoverGroups } from '@/src/features/groups';

function GruposScreen() {
  const { user, token } = useAuth();
  
  // Obtener mis grupos
  const { myGroups, loading, reloadMyGroups } = useMyGroups(user.id_user, token);
  
  // Descubrir grupos disponibles
  const { groups: availableGroups } = useDiscoverGroups(user.id_user, token);
  
  return (
    // Tu UI con pestañas "Mis Grupos" y "Descubrir"
  );
}
```

### 4. Gestión de Invitaciones

```tsx
import { useGroupInvitations } from '@/src/features/groups';
import { GroupInvitationCard } from '@/src/features/groups/components';

function InvitacionesScreen() {
  const { user, token } = useAuth();
  const {
    pendingInvitations,
    loading,
    respondToInvitation,
  } = useGroupInvitations(user.id_user, token);

  const handleAccept = async (invitationId: number) => {
    try {
      await respondToInvitation(invitationId, 'accepted');
      // Navegar al grupo o mostrar mensaje de éxito
    } catch (error) {
      // Manejar error
    }
  };

  return (
    <FlatList
      data={pendingInvitations}
      renderItem={({ item }) => (
        <GroupInvitationCard
          invitation={item}
          onAccept={() => handleAccept(item.id_invitation)}
          onReject={() => respondToInvitation(item.id_invitation, 'rejected')}
        />
      )}
    />
  );
}
```

### 5. Notificaciones

```tsx
import { useUserNotifications } from '@/src/features/notifications/hooks';
import { NotificationCard } from '@/src/features/notifications/components';

function NotificacionesScreen() {
  const { user, token } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useUserNotifications(user.id_user, token);

  const handlePress = (notification) => {
    markAsRead(notification.id_notification);
    
    // Navegar según el tipo de notificación
    switch (notification.notification_type) {
      case 'group_invitation':
        // Navegar a invitaciones
        break;
      case 'new_message':
        // Navegar al chat del grupo
        break;
    }
  };

  return (
    <>
      {unreadCount > 0 && (
        <TouchableOpacity onPress={markAllAsRead}>
          <Text>Marcar todas como leídas</Text>
        </TouchableOpacity>
      )}
      
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => handlePress(item)}
          />
        )}
      />
    </>
  );
}
```

## 🔐 Permisos y Validaciones

### Editar Mensajes
- ✅ Solo el **autor** del mensaje puede editarlo
- ❌ Otros usuarios no pueden editar

### Eliminar Mensajes
- ✅ El **autor** del mensaje puede eliminarlo
- ✅ El **admin del grupo** puede eliminar cualquier mensaje
- ❌ Otros usuarios no pueden eliminar

### Invitar a Grupos
- ✅ Solo el **creador/admin** del grupo puede invitar
- ❌ Los miembros regulares NO pueden invitar
- ✅ Solo se puede invitar a usuarios inscritos en la misma materia

### Crear Grupos
- ✅ Máximo **3 grupos por materia** por usuario
- ✅ Solo se puede crear grupo en materias donde el usuario esté inscrito

## 🌐 Eventos WebSocket

### Eventos que Emitimos

```typescript
// Autenticar
socket.emit('authenticate', {
  id_user: 10,
  id_membership: 15,
  id_group: 3,
});

// Enviar mensaje
socket.emit('message:send', {
  id_membership: 15,
  text_content: 'Hola!',
  attachments: '',
});

// Editar mensaje
socket.emit('message:edit', {
  id_message: 101,
  text_content: 'Mensaje editado',
});

// Eliminar mensaje
socket.emit('message:delete', {
  id_message: 101,
});

// Usuario escribiendo
socket.emit('user:typing', {
  id_user: 10,
  full_name: 'Juan Pérez',
  is_typing: true,
});
```

### Eventos que Escuchamos

```typescript
// Usuario conectado
socket.on('user:connected', (data) => {
  
});

// Nuevo mensaje
socket.on('message:new', (message) => {
  // Agregar a la lista de mensajes
});

// Mensaje editado
socket.on('message:edited', (data) => {
  // Actualizar mensaje en la UI
});

// Mensaje eliminado
socket.on('message:deleted', (data) => {
  // Remover mensaje de la UI
});

// Usuario escribiendo
socket.on('user:typing', (data) => {
  // Mostrar indicador
});
```

## 📊 Flujos Completos

### Flujo de Crear Grupo e Invitar

1. Usuario crea grupo con `POST /groups`
2. Backend valida límite de 3 grupos por materia
3. Se crea el grupo y se agrega automáticamente como admin
4. Admin invita usuarios con `POST /group-invitations`
5. Backend valida que invitee esté en la misma materia
6. Sistema crea notificación automática para el invitado
7. Invitado ve notificación y acepta con `PATCH /group-invitations/:id/respond`
8. Backend crea membresía automáticamente
9. Sistema notifica al admin que aceptaron
10. Nuevo miembro puede acceder al chat del grupo

### Flujo de Chat en Tiempo Real

1. Usuario entra al grupo y conecta WebSocket
2. Autentica con `socket.emit('authenticate')`
3. Carga historial con `GET /messages/group/:id/recent`
4. Usuario escribe y emite `user:typing`
5. Otros usuarios ven "...está escribiendo"
6. Usuario envía con `socket.emit('message:send')`
7. Todos reciben `message:new` instantáneamente
8. Sistema crea notificaciones para miembros offline
9. Mensajes persisten en BD para futuros ingresos

## 🔄 Reconexión Automática

El servicio WebSocket maneja automáticamente:

- ✅ Reconexión al perder conexión
- ✅ Re-autenticación automática
- ✅ Máximo 5 intentos de reconexión
- ✅ Indicador visual de estado de conexión

## 📝 Notas Importantes

1. **URL del Servidor**: Cambiar `http://localhost:3000` por la URL de producción
2. **Tokens JWT**: Todos los endpoints REST requieren `Authorization: Bearer <token>`
3. **Persistencia**: Los mensajes NO se borran al cerrar sesión
4. **Optimistic UI**: Considerar mostrar mensajes antes de confirmar envío
5. **Typing Debounce**: Implementado con 3 segundos de timeout automático

## 🐛 Troubleshooting

### WebSocket no conecta
- Verificar que el servidor esté corriendo
- Verificar la URL del servidor
- Revisar CORS en el backend

### Mensajes no se cargan
- Verificar token JWT válido
- Revisar que el usuario sea miembro del grupo
- Verificar logs de red en dev tools

### Notificaciones no llegan
- Los eventos se emiten solo si WebSocket está conectado
- Verificar que el sistema de notificaciones del backend esté activo

## 📚 Tipos TypeScript

Todos los tipos están definidos en:
- `src/features/messages/types/index.ts`
- `src/features/groups/types/index.ts`
- `src/features/notifications/types/index.ts`

## 🎯 Próximos Pasos Sugeridos

1. Implementar modal de edición de mensajes
2. Agregar soporte para archivos adjuntos
3. Implementar estados de entrega (enviado, leído)
4. Agregar reacciones a mensajes
5. Implementar búsqueda avanzada en grupos
6. Agregar notificaciones push con Expo

---

**Desarrollado para Uniconnect - Sistema de Mensajería Universitaria**
