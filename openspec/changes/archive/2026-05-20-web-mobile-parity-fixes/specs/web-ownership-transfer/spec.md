## ADDED Requirements

### Requirement: Owner puede iniciar flujo de salida con transferencia
El dueño de un grupo SHALL poder presionar "Salir" y ser redirigido a un flujo de transferencia de propiedad si existen otros miembros.

#### Scenario: Owner con miembros ve modal de transferencia
- **WHEN** el owner presiona "Salir del grupo"
- **AND** el grupo tiene otros miembros
- **THEN** se abre `TransferOwnershipModal` con lista de miembros elegibles
- **AND** el owner selecciona un candidato y confirma

#### Scenario: Owner sin miembros sale directamente
- **WHEN** el owner presiona "Salir del grupo"
- **AND** el grupo no tiene otros miembros
- **THEN** se ejecuta `leaveGroup` directamente sin modal

#### Scenario: Transferencia exitosa navega fuera del grupo
- **WHEN** el owner confirma la transferencia
- **THEN** se envía solicitud al candidato
- **AND** se muestra banner de transferencia pendiente
- **AND** el usuario es redirigido a `/groups`

### Requirement: Banner bloquea salida mientras transferencia está pendiente
El sistema SHALL mostrar un banner informativo y bloquear el botón de salir mientras existe `pending_owner_id`.

#### Scenario: Transferencia pendiente muestra banner
- **WHEN** el grupo tiene `pending_owner_id` no nulo
- **THEN** se renderiza `PendingTransferOwnerBanner` en la parte superior del detalle
- **AND** el botón "Salir" está deshabilitado
- **AND** se muestra el nombre del candidato si está disponible

#### Scenario: Resolución de transferencia habilita salida
- **WHEN** el candidato acepta o rechaza la transferencia
- **THEN** `pending_owner_id` se vuelve nulo
- **AND** el banner desaparece
- **AND** el botón "Salir" se habilita nuevamente
