## ADDED Requirements

### Requirement: Badge de notificaciones usa estilo YouTube
El badge de notificaciones en el navbar SHALL usar un círculo rojo pequeño posicionado sobre el icono de campana, sin texto de etiqueta.

#### Scenario: Notificaciones no leídas muestran badge rojo
- **WHEN** `notificationsStore.unreadCount` es mayor a 0
- **THEN** el componente `NotificationBadge` renderiza un círculo rojo (`#DC2626`) sobre la campana
- **AND** el círculo contiene el número en blanco
- **AND** el círculo desaparece cuando el contador llega a 0

#### Scenario: Navbar usa solo icono sin texto
- **WHEN** el usuario ve el navbar en cualquier resolución
- **THEN** el enlace/botón de notificaciones muestra solo el icono `Bell`
- **AND** NO muestra el texto "Notificaciones"
- **AND** mantiene `aria-label="Notificaciones"` para accesibilidad

#### Scenario: Badge se actualiza en tiempo real
- **WHEN** llega una nueva notificación vía WebSocket o polling
- **THEN** `notificationsStore` actualiza `unreadCount`
- **AND** `NotificationBadge` (como `observer`) re-renderiza automáticamente
- **AND** el número en el badge refleja el nuevo conteo
