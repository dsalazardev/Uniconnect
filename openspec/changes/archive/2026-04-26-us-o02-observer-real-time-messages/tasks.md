# Tasks: US-O02 - Observer para Mensajes del Chat en Tiempo Real

## 1. Preparación y DTOs

- [ ] 1.1 Crear DTOs tipados en `src/messages/dto/websocket-message.dto.ts` para `MessageReadDto`, `UserPresenceDto`, `GroupActivityDto`
- [ ] 1.2 Validar que todos los DTOs usen tipado estricto (cero `any`)
- [ ] 1.3 Exportar los nuevos DTOs desde el archivo de índice del módulo

## 2. Extender ChatSessionManager

- [ ] 2.1 Agregar propiedad privada `userPresences: Map<number, 'online' | 'offline' | 'away'>` al singleton
- [ ] 2.2 Implementar método `setUserPresence(userId: number, status: 'online' | 'offline' | 'away'): void`
- [ ] 2.3 Implementar método `getUserPresence(userId: number): 'online' | 'offline' | 'away' | null`
- [ ] 2.4 Implementar método `getGroupPresences(groupId: number): Map<number, 'online' | 'offline' | 'away'>`
- [ ] 2.5 Actualizar método `removeUserSession()` para establecer presencia a 'offline' al desconectar

## 3. Implementar Handler message:read

- [ ] 3.1 Agregar handler `@SubscribeMessage('message:read')` en `MessagesGateway`
- [ ] 3.2 Validar autenticación del cliente (verificar `client.data.id_user` y `client.data.id_group`)
- [ ] 3.3 Extraer datos del evento usando `@MessageBody() data: MessageReadDto`
- [ ] 3.4 Emitir evento `message:read` a todos los usuarios en el room del grupo usando `server.to(roomName).emit()`
- [ ] 3.5 Agregar logging con `this.logger.log()` para rastrear lecturas de mensajes
- [ ] 3.6 Implementar try/catch con manejo de errores y retorno de error al cliente

## 4. Implementar Handler user:presence

- [ ] 4.1 Agregar handler `@SubscribeMessage('user:presence')` en `MessagesGateway`
- [ ] 4.2 Validar autenticación del cliente
- [ ] 4.3 Extraer datos del evento usando `@MessageBody() data: { status: 'online' | 'offline' | 'away' }`
- [ ] 4.4 Actualizar presencia en `ChatSessionManager` usando `setUserPresence()`
- [ ] 4.5 Implementar throttling básico (máximo 1 emisión cada 5 segundos por usuario)
- [ ] 4.6 Emitir evento `user:presence` a todos los usuarios en el room del grupo
- [ ] 4.7 Agregar logging de cambios de presencia
- [ ] 4.8 Implementar try/catch con manejo de errores

## 5. Implementar Handler group:activity

- [ ] 5.1 Agregar handler `@SubscribeMessage('group:activity')` en `MessagesGateway`
- [ ] 5.2 Validar autenticación del cliente
- [ ] 5.3 Extraer datos del evento usando `@MessageBody() data: GroupActivityDto`
- [ ] 5.4 Validar que `activity_type` sea uno de: 'member_joined' | 'member_left' | 'group_updated'
- [ ] 5.5 Emitir evento `group:activity` a todos los usuarios en el room del grupo
- [ ] 5.6 Agregar logging de actividades del grupo
- [ ] 5.7 Implementar try/catch con manejo de errores

## 6. Actualizar Handler authenticate

- [ ] 6.1 Modificar handler `authenticate` para establecer presencia inicial a 'online' al conectar
- [ ] 6.2 Llamar a `ChatSessionManager.setUserPresence(userId, 'online')` después de autenticación exitosa
- [ ] 6.3 Emitir evento `user:presence` con status 'online' al grupo después de autenticación

## 7. Actualizar Handler handleDisconnect

- [ ] 7.1 Modificar `handleDisconnect()` para establecer presencia a 'offline' al desconectar
- [ ] 7.2 Emitir evento `user:presence` con status 'offline' antes de remover sesión
- [ ] 7.3 Registrar timestamp `last_seen` en el evento de desconexión

## 8. Tests Unitarios del Patrón Observer

- [ ] 8.1 Crear archivo de tests `src/messages/__tests__/messages.gateway.observer.spec.ts`
- [ ] 8.2 Configurar mocks de `Server` con `jest.fn()` para `to()` y `emit()`
- [ ] 8.3 Implementar test: "should notify observers when message is read"
- [ ] 8.4 Implementar test: "should broadcast user presence to group"
- [ ] 8.5 Implementar test: "should emit group activity events"
- [ ] 8.6 Implementar test: "should throttle presence updates to 5 seconds"
- [ ] 8.7 Implementar test: "should set presence to offline on disconnect"
- [ ] 8.8 Implementar test: "should only notify users in the same group"
- [ ] 8.9 Verificar que todos los tests usen `jest.spyOn()` para rastrear emisiones
- [ ] 8.10 Ejecutar tests y verificar 100% de cobertura de nuevos handlers

## 9. Tests de ChatSessionManager

- [ ] 9.1 Crear archivo de tests `src/messages/managers/__tests__/chat-session.manager.spec.ts` (si no existe)
- [ ] 9.2 Implementar test: "should set and get user presence"
- [ ] 9.3 Implementar test: "should return null for non-existent user presence"
- [ ] 9.4 Implementar test: "should get all presences for a group"
- [ ] 9.5 Implementar test: "should set presence to offline on removeUserSession"

## 10. Documentación del Patrón Observer

- [ ] 10.1 Crear archivo `openspec/changes/us-o02-observer-real-time-messages/docs/observer-pattern.md`
- [ ] 10.2 Escribir sección "Definición del Patrón Observer"
- [ ] 10.3 Escribir sección "Implementación en Uniconnect" explicando MessagesGateway como Sujeto
- [ ] 10.4 Escribir sección "Mecanismo de Suscripción" explicando `@SubscribeMessage()`
- [ ] 10.5 Escribir sección "Mecanismo de Notificación" explicando `server.to().emit()`
- [ ] 10.6 Agregar ejemplos de código TypeScript para backend y frontend
- [ ] 10.7 Escribir sección "Limitaciones" (estado en memoria, escalabilidad horizontal)

## 11. Diagramas Arquitectónicos

- [ ] 11.1 Crear archivo `openspec/changes/us-o02-observer-real-time-messages/docs/architecture-diagrams.md`
- [ ] 11.2 Crear diagrama ASCII de relación Sujeto-Observador (MessagesGateway → Clientes)
- [ ] 11.3 Crear diagrama de secuencia para evento `message:read`
- [ ] 11.4 Crear diagrama de secuencia para evento `user:presence`
- [ ] 11.5 Crear diagrama de secuencia para evento `group:activity`
- [ ] 11.6 Crear diagrama de arquitectura de rooms de Socket.IO

## 12. Integración y Validación

- [ ] 12.1 Ejecutar `npm run test` y verificar que todos los tests pasen
- [ ] 12.2 Ejecutar `npm run test:cov` y verificar cobertura mínima de 80%
- [ ] 12.3 Ejecutar `npm run lint` y corregir cualquier error de linting
- [ ] 12.4 Ejecutar `npm run build` y verificar que la compilación sea exitosa
- [ ] 12.5 Probar manualmente los nuevos handlers con un cliente WebSocket (Postman o frontend)
- [ ] 12.6 Verificar que handlers existentes no se hayan roto (regresión)

## 13. Actualización de AGENTS.md

- [ ] 13.1 Abrir `AGENTS.md` y localizar sección "REGLAS PARA HISTORIAS DE USUARIO (OBSERVER Y DECORATOR)"
- [ ] 13.2 Actualizar estado de US-O02 de "⚠️ TESTING PENDIENTE" a "✅ COMPLETADO"
- [ ] 13.3 Agregar referencia a la documentación creada en `docs/observer-pattern.md`
- [ ] 13.4 Agregar referencia a los tests implementados en `__tests__/messages.gateway.observer.spec.ts`
- [ ] 13.5 Documentar los nuevos handlers agregados: `message:read`, `user:presence`, `group:activity`
