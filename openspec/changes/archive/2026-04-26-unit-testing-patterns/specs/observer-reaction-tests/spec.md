## ADDED Requirements

### Requirement: NotificationEventListener handles MESSAGE_SENT
El listener SHALL crear una notificación en BD para el destinatario cuando se recibe el evento `MESSAGE_SENT`.

#### Scenario: Creates notification for message recipient
- **WHEN** `handleMessageSent()` recibe un `MessageSentPayload` válido
- **THEN** `prisma.notification.create` es llamado con `id_user` del destinatario y `notification_type: 'message_sent'`

#### Scenario: Does not throw on BD error
- **WHEN** `prisma.notification.create` lanza una excepción
- **THEN** el handler captura el error y NO propaga la excepción

### Requirement: NotificationEventListener handles GROUP_INVITATION_SENT
El listener SHALL crear una notificación para el invitado cuando se recibe `GROUP_INVITATION_SENT`.

#### Scenario: Creates notification for invitee
- **WHEN** `handleGroupInvitationSent()` recibe un `GroupInvitationSentPayload`
- **THEN** `prisma.notification.create` es llamado con `id_user: payload.invitee_id` y `notification_type: 'group_invitation_sent'`

#### Scenario: Does not throw on BD error
- **WHEN** `prisma.notification.create` lanza una excepción
- **THEN** el handler NO propaga la excepción

### Requirement: NotificationEventListener handles GROUP_INVITATION_ACCEPTED
El listener SHALL crear una notificación para el invitador cuando se acepta su invitación.

#### Scenario: Creates notification for inviter
- **WHEN** `handleGroupInvitationAccepted()` recibe un `GroupInvitationAcceptedPayload`
- **THEN** `prisma.notification.create` es llamado con `id_user: payload.inviter_id` y `notification_type: 'group_invitation_accepted'`

#### Scenario: Does not throw on BD error
- **WHEN** `prisma.notification.create` lanza una excepción
- **THEN** el handler NO propaga la excepción

### Requirement: NotificationEventListener handles USER_JOINED_GROUP
El listener SHALL crear notificaciones para los miembros existentes del grupo cuando un usuario se une.

#### Scenario: Creates notifications for existing members
- **WHEN** `handleUserJoinedGroup()` recibe un `UserJoinedGroupPayload`
- **THEN** `prisma.notification.createMany` es llamado con notificaciones para los miembros del grupo

#### Scenario: Does not throw on BD error
- **WHEN** `prisma.notification.createMany` lanza una excepción
- **THEN** el handler NO propaga la excepción

### Requirement: NotificationEventListener handles CONNECTION_REQUEST_SENT
El listener SHALL crear una notificación para el destinatario de la solicitud de conexión.

#### Scenario: Creates notification for adressee
- **WHEN** `handleConnectionRequestSent()` recibe un `ConnectionRequestSentPayload`
- **THEN** `prisma.notification.create` es llamado con `id_user: payload.adressee_id` y `notification_type: 'connection_request_sent'`

#### Scenario: Does not throw on BD error
- **WHEN** `prisma.notification.create` lanza una excepción
- **THEN** el handler NO propaga la excepción

### Requirement: NotificationEventListener handles GROUP_JOIN_REQUEST_SENT
El listener SHALL crear una notificación para el owner del grupo cuando llega una solicitud de unión.

#### Scenario: Creates notification for group owner
- **WHEN** `handleGroupJoinRequestSent()` recibe un `GroupJoinRequestSentPayload`
- **THEN** `prisma.notification.create` es llamado con `id_user: payload.owner_id` y `notification_type: 'group_join_request_sent'`

#### Scenario: Does not throw on BD error
- **WHEN** `prisma.notification.create` lanza una excepción
- **THEN** el handler NO propaga la excepción

### Requirement: NotificationEventListener handles GROUP_JOIN_REQUEST_ACCEPTED
El listener SHALL crear una notificación para el solicitante cuando su solicitud es aceptada.

#### Scenario: Creates notification for requester
- **WHEN** `handleGroupJoinRequestAccepted()` recibe un `GroupJoinRequestAcceptedPayload`
- **THEN** `prisma.notification.create` es llamado con `id_user: payload.requester_id` y `notification_type: 'group_join_request_accepted'`

#### Scenario: Does not throw on BD error
- **WHEN** `prisma.notification.create` lanza una excepción
- **THEN** el handler NO propaga la excepción

### Requirement: NotificationEventListener handles GROUP_JOIN_REQUEST_REJECTED
El listener SHALL crear una notificación para el solicitante cuando su solicitud es rechazada.

#### Scenario: Creates notification for requester
- **WHEN** `handleGroupJoinRequestRejected()` recibe un `GroupJoinRequestRejectedPayload`
- **THEN** `prisma.notification.create` es llamado con `id_user: payload.requester_id` y `notification_type: 'group_join_request_rejected'`

#### Scenario: Does not throw on BD error
- **WHEN** `prisma.notification.create` lanza una excepción
- **THEN** el handler NO propaga la excepción
