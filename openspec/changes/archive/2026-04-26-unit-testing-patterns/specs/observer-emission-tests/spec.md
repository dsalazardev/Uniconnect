## ADDED Requirements

### Requirement: GroupInvitationsService emits GROUP_INVITATION_SENT
El servicio SHALL emitir `MESSAGE_EVENTS.GROUP_INVITATION_SENT` con payload tipado `GroupInvitationSentPayload` después de crear exitosamente una invitación en BD.

#### Scenario: Emits after successful invitation creation
- **WHEN** `sendInvitation()` completa la inserción en BD
- **THEN** `eventEmitter.emit` es llamado con `MESSAGE_EVENTS.GROUP_INVITATION_SENT` y payload que contiene `id_invitation`, `id_group`, `inviter_id`, `invitee_id`

#### Scenario: Does not emit if BD operation fails
- **WHEN** `prisma.group_invitation.create` lanza una excepción
- **THEN** `eventEmitter.emit` NO es llamado

### Requirement: GroupInvitationsService emits GROUP_INVITATION_ACCEPTED
El servicio SHALL emitir `MESSAGE_EVENTS.GROUP_INVITATION_ACCEPTED` y `MESSAGE_EVENTS.USER_JOINED_GROUP` después de aceptar una invitación.

#### Scenario: Emits both events on accept
- **WHEN** `respondToInvitation()` acepta una invitación con `status: 'accepted'`
- **THEN** `eventEmitter.emit` es llamado con `GROUP_INVITATION_ACCEPTED` y también con `USER_JOINED_GROUP`

#### Scenario: Emits GROUP_INVITATION_REJECTED on reject
- **WHEN** `respondToInvitation()` rechaza con `status: 'rejected'`
- **THEN** `eventEmitter.emit` es llamado con `MESSAGE_EVENTS.GROUP_INVITATION_REJECTED`
- **THEN** `eventEmitter.emit` NO es llamado con `USER_JOINED_GROUP`

### Requirement: ConnectionsService emits CONNECTION_REQUEST_SENT
El servicio SHALL emitir `MESSAGE_EVENTS.CONNECTION_REQUEST_SENT` con payload tipado después de crear exitosamente una solicitud de conexión.

#### Scenario: Emits after successful connection request
- **WHEN** `requestConnection()` completa la inserción en BD
- **THEN** `eventEmitter.emit` es llamado con `MESSAGE_EVENTS.CONNECTION_REQUEST_SENT` y payload que contiene `requester_id`, `adressee_id`

#### Scenario: Does not emit if BD operation fails
- **WHEN** `prisma.connection.create` lanza una excepción
- **THEN** `eventEmitter.emit` NO es llamado

### Requirement: MessagesService emits MESSAGE_SENT, MESSAGE_EDITED, MESSAGE_DELETED
El servicio SHALL emitir los eventos correspondientes después de cada operación exitosa sobre mensajes.

#### Scenario: Emits MESSAGE_SENT after create
- **WHEN** `create()` guarda un mensaje en BD exitosamente
- **THEN** `eventEmitter.emit` es llamado con `MESSAGE_EVENTS.MESSAGE_SENT` y payload que contiene `id_message`, `id_membership`, `text_content`

#### Scenario: Emits MESSAGE_EDITED after update
- **WHEN** `update()` edita un mensaje en BD exitosamente
- **THEN** `eventEmitter.emit` es llamado con `MESSAGE_EVENTS.MESSAGE_EDITED`

#### Scenario: Emits MESSAGE_DELETED after delete
- **WHEN** `remove()` elimina un mensaje en BD exitosamente
- **THEN** `eventEmitter.emit` es llamado con `MESSAGE_EVENTS.MESSAGE_DELETED`

#### Scenario: Does not emit MESSAGE_SENT if create fails
- **WHEN** `prisma.message.create` lanza una excepción
- **THEN** `eventEmitter.emit` NO es llamado con `MESSAGE_EVENTS.MESSAGE_SENT`
