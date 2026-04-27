# Tasks: US-O01 - Observer para Eventos del Grupo de Estudio

## 1. Preparación de Payloads Tipados

- [ ] 1.1 Agregar interface `GroupCreatedPayload` en `src/messages/events/message.events.ts`
- [ ] 1.2 Agregar interface `GroupUpdatedPayload` en `src/messages/events/message.events.ts`
- [ ] 1.3 Agregar interface `GroupDeletedPayload` en `src/messages/events/message.events.ts`
- [ ] 1.4 Agregar interface `UserLeftGroupPayload` en `src/messages/events/message.events.ts`
- [ ] 1.5 Validar que todas las interfaces usen tipado estricto (cero `any`)

## 2. Emisión de Eventos en GroupsService

- [ ] 2.1 Agregar emisión de `GROUP_CREATED` en método `create()` después de transacción exitosa
- [ ] 2.2 Construir payload de `GROUP_CREATED` con datos de `group`, `user`, `course`
- [ ] 2.3 Agregar emisión de `GROUP_UPDATED` en método `update()` después de update exitoso
- [ ] 2.4 Construir payload de `GROUP_UPDATED` con `updated_fields` array
- [ ] 2.5 Agregar emisión de `GROUP_DELETED` en método `remove()` después de delete exitoso
- [ ] 2.6 Construir payload de `GROUP_DELETED` con datos del grupo antes de eliminación
- [ ] 2.7 Agregar emisión de `USER_LEFT_GROUP` en método `leaveGroup()` después de delete membership
- [ ] 2.8 Construir payload de `USER_LEFT_GROUP` con datos de `user`, `group`, `membership`

## 3. Crear GroupActivityListener

- [ ] 3.1 Crear archivo `src/groups/listeners/group-activity.listener.ts`
- [ ] 3.2 Crear clase `GroupActivityListener` con decorador `@Injectable()`
- [ ] 3.3 Inyectar `PrismaService` y `Logger` en el constructor
- [ ] 3.4 Importar `MESSAGE_EVENTS` y payloads desde `src/messages/events/message.events.ts`

## 4. Implementar Handler para GROUP_CREATED

- [ ] 4.1 Agregar método `handleGroupCreated()` con decorador `@OnEvent(MESSAGE_EVENTS.GROUP_CREATED)`
- [ ] 4.2 Recibir `GroupCreatedPayload` como parámetro tipado
- [ ] 4.3 Implementar try/catch defensivo
- [ ] 4.4 Crear notificación para el owner con mensaje "Grupo '{name}' creado exitosamente"
- [ ] 4.5 Establecer `notification_type: 'group_created'` y `related_entity_id: id_group`
- [ ] 4.6 Agregar logging con `this.logger.log()` para rastrear evento procesado

## 5. Implementar Handler para GROUP_UPDATED

- [ ] 5.1 Agregar método `handleGroupUpdated()` con decorador `@OnEvent(MESSAGE_EVENTS.GROUP_UPDATED)`
- [ ] 5.2 Recibir `GroupUpdatedPayload` como parámetro tipado
- [ ] 5.3 Implementar try/catch defensivo
- [ ] 5.4 Obtener todos los miembros del grupo excepto el owner usando `prisma.membership.findMany()`
- [ ] 5.5 Crear notificaciones batch con `createMany()` para todos los miembros
- [ ] 5.6 Mensaje: "El grupo '{name}' fue actualizado"
- [ ] 5.7 Establecer `notification_type: 'group_updated'`
- [ ] 5.8 Agregar logging con conteo de notificaciones creadas

## 6. Implementar Handler para GROUP_DELETED

- [ ] 6.1 Agregar método `handleGroupDeleted()` con decorador `@OnEvent(MESSAGE_EVENTS.GROUP_DELETED)`
- [ ] 6.2 Recibir `GroupDeletedPayload` como parámetro tipado
- [ ] 6.3 Implementar try/catch defensivo
- [ ] 6.4 Nota: No se pueden obtener miembros porque el grupo ya fue eliminado
- [ ] 6.5 Implementar lógica alternativa: obtener miembros ANTES de emitir evento (modificar GroupsService.remove())
- [ ] 6.6 Pasar lista de `member_ids` en payload de `GROUP_DELETED`
- [ ] 6.7 Crear notificaciones para todos los miembros con mensaje "El grupo '{name}' fue eliminado"
- [ ] 6.8 Establecer `notification_type: 'group_deleted'`

## 7. Implementar Handler para USER_LEFT_GROUP

- [ ] 7.1 Agregar método `handleUserLeftGroup()` con decorador `@OnEvent(MESSAGE_EVENTS.USER_LEFT_GROUP)`
- [ ] 7.2 Recibir `UserLeftGroupPayload` como parámetro tipado
- [ ] 7.3 Implementar try/catch defensivo
- [ ] 7.4 Obtener miembros restantes del grupo (excluir al usuario que salió)
- [ ] 7.5 Crear notificaciones batch para miembros restantes
- [ ] 7.6 Mensaje: "{user} salió del grupo '{name}'"
- [ ] 7.7 Establecer `notification_type: 'user_left_group'`
- [ ] 7.8 Agregar logging con conteo de notificaciones

## 8. Registrar Listener en GroupsModule

- [ ] 8.1 Abrir `src/groups/groups.module.ts`
- [ ] 8.2 Importar `GroupActivityListener` desde `./listeners/group-activity.listener`
- [ ] 8.3 Agregar `GroupActivityListener` al array de `providers`
- [ ] 8.4 Verificar que `EventEmitterModule` esté importado en `AppModule` (ya debería estar)

## 9. Ajustar Payload de GROUP_DELETED

- [ ] 9.1 Modificar interface `GroupDeletedPayload` para incluir `member_ids: number[]`
- [ ] 9.2 En `GroupsService.remove()`, obtener lista de miembros ANTES de eliminar grupo
- [ ] 9.3 Incluir `member_ids` en payload al emitir `GROUP_DELETED`
- [ ] 9.4 Actualizar handler `handleGroupDeleted()` para usar `member_ids` del payload

## 10. Tests Unitarios de Emisiones (GroupsService)

- [ ] 10.1 Crear archivo `src/groups/__tests__/groups.service.observer.spec.ts`
- [ ] 10.2 Configurar mocks de `EventEmitter2` con `jest.fn()`
- [ ] 10.3 Implementar test: "should emit GROUP_CREATED on successful create"
- [ ] 10.4 Implementar test: "should emit GROUP_UPDATED on successful update"
- [ ] 10.5 Implementar test: "should emit GROUP_DELETED on successful remove"
- [ ] 10.6 Implementar test: "should emit USER_LEFT_GROUP on successful leaveGroup"
- [ ] 10.7 Implementar test: "should NOT emit event when operation fails"
- [ ] 10.8 Verificar que todos los tests usen `jest.spyOn(eventEmitter, 'emit')`
- [ ] 10.9 Validar que payloads emitidos tengan estructura correcta

## 11. Tests Unitarios de Handlers (GroupActivityListener)

- [ ] 11.1 Crear archivo `src/groups/listeners/__tests__/group-activity.listener.spec.ts`
- [ ] 11.2 Configurar mocks de `PrismaService` con `jest.fn()`
- [ ] 11.3 Implementar test: "should create notification for owner on GROUP_CREATED"
- [ ] 11.4 Implementar test: "should create notifications for members on GROUP_UPDATED"
- [ ] 11.5 Implementar test: "should create notifications for members on GROUP_DELETED"
- [ ] 11.6 Implementar test: "should create notifications for remaining members on USER_LEFT_GROUP"
- [ ] 11.7 Implementar test: "should log error but not throw when notification creation fails"
- [ ] 11.8 Implementar test: "should use createMany for batch notifications"
- [ ] 11.9 Verificar que todos los tests validen estructura de notificaciones creadas

## 12. Documentación del Patrón Observer

- [ ] 12.1 Crear archivo `openspec/changes/us-o01-study-group-events/docs/observer-pattern-groups.md`
- [ ] 12.2 Escribir sección "Eventos del Ciclo de Vida de Grupos"
- [ ] 12.3 Documentar cada evento con su payload y propósito
- [ ] 12.4 Escribir sección "GroupsService como Sujeto"
- [ ] 12.5 Documentar métodos que emiten eventos y cuándo
- [ ] 12.6 Escribir sección "GroupActivityListener como Observador"
- [ ] 12.7 Documentar handlers y lógica de notificación
- [ ] 12.8 Agregar ejemplos de código para emisión y manejo de eventos

## 13. Diagramas de Flujo

- [ ] 13.1 Crear archivo `openspec/changes/us-o01-study-group-events/docs/flow-diagrams.md`
- [ ] 13.2 Crear diagrama ASCII de flujo para `GROUP_CREATED`
- [ ] 13.3 Crear diagrama ASCII de flujo para `GROUP_UPDATED`
- [ ] 13.4 Crear diagrama ASCII de flujo para `GROUP_DELETED`
- [ ] 13.5 Crear diagrama ASCII de flujo para `USER_LEFT_GROUP`
- [ ] 13.6 Crear diagrama de arquitectura mostrando GroupsService → EventEmitter → GroupActivityListener

## 14. Integración y Validación

- [ ] 14.1 Ejecutar `npm run test` y verificar que todos los tests pasen
- [ ] 14.2 Ejecutar `npm run test:cov` y verificar cobertura mínima de 80%
- [ ] 14.3 Ejecutar `npm run lint` y corregir errores de linting
- [ ] 14.4 Ejecutar `npm run build` y verificar compilación exitosa
- [ ] 14.5 Probar manualmente creación de grupo y verificar notificación
- [ ] 14.6 Probar manualmente actualización de grupo y verificar notificaciones a miembros
- [ ] 14.7 Probar manualmente eliminación de grupo y verificar notificaciones
- [ ] 14.8 Probar manualmente salida de usuario y verificar notificaciones
- [ ] 14.9 Verificar que eventos existentes no se hayan roto (regresión)

## 15. Actualización de AGENTS.md

- [ ] 15.1 Abrir `AGENTS.md` y localizar sección "REGLAS PARA HISTORIAS DE USUARIO"
- [ ] 15.2 Actualizar estado de US-O01 de "⚠️ PENDIENTE" a "✅ COMPLETADO"
- [ ] 15.3 Documentar los 4 eventos implementados: `GROUP_CREATED`, `GROUP_UPDATED`, `GROUP_DELETED`, `USER_LEFT_GROUP`
- [ ] 15.4 Agregar referencia a `GroupActivityListener` en ubicaciones de implementación
- [ ] 15.5 Agregar referencia a tests implementados
- [ ] 15.6 Agregar referencia a documentación creada
