## ADDED Requirements

### Requirement: GroupDetail detecta chats directos y adapta la UI
El componente `GroupDetail` SHALL detectar si el grupo es un chat directo (`is_direct_message === true`) y adaptar su renderizado en consecuencia.

#### Scenario: Chat directo oculta miembros y admin
- **WHEN** el usuario navega a un grupo con `is_direct_message: true`
- **THEN** el título del header muestra el nombre del otro usuario, no "Detalle del Grupo"
- **AND** la sección "Miembros" NO se renderiza
- **AND** el botón de administración NO se muestra
- **AND** el chat se presenta como conversación privada

#### Scenario: Chat grupal mantiene comportamiento actual
- **WHEN** el usuario navega a un grupo con `is_direct_message: false` o `undefined`
- **THEN** el título muestra el nombre del grupo
- **AND** la sección "Miembros" se renderiza normalmente
- **AND** el panel de administración se muestra si el usuario es owner/admin

### Requirement: useDirectMessage navega a la conversación
El hook `useDirectMessage` SHALL completar la navegación al grupo DM creado/encontrado usando React Router.

#### Scenario: Iniciar chat privado desde cualquier pantalla
- **WHEN** una función llama a `openDirectMessage(targetUserId)`
- **THEN** el servicio busca o crea el DM
- **AND** el hook navega a `/groups/{groupId}` usando `useNavigate()`
- **AND** `GroupDetail` detecta que es DM y adapta la UI
