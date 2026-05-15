import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { SendMessageDto, MessageEventDto, MessageReadDto, UserPresenceDto, GroupActivityDto } from './dto/websocket-message.dto';
import { Logger, Inject } from '@nestjs/common';
import { SocketData } from './types/SocketData';
import { ChatSessionManager } from './managers/chat-session.manager';
import { PrismaService } from '../prisma/prisma.service';
import { ContentModeration } from './decorators/content-moderation.decorator';
import { VALIDACION_CHAIN_TOKEN } from './application/messages.service';
import type { IValidadorMensajeHandler } from './domain/chain-of-responsibility/interfaces';
import { BaseMessage } from './domain/decorator/base-message';
import { FileMessageDecorator } from './domain/decorator/file-message.decorator';
import { MentionMessageDecorator } from './domain/decorator/mention-message.decorator';

@WebSocketGateway({
  cors: {
    origin: '*', // Cambiar esto en producción a tu dominio frontend
    methods: ['GET', 'POST'],
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  server: Server;
  private readonly logger = new Logger(MessagesGateway.name);
  private readonly sessionManager = ChatSessionManager.getInstance();
  
  // Throttling para eventos de presencia (userId -> timestamp)
  private presenceThrottle: Map<number, number> = new Map();
  private readonly PRESENCE_THROTTLE_MS = 5000; // 5 segundos

  constructor(
    private messagesService: MessagesService,
    private prisma: PrismaService,
    @Inject(VALIDACION_CHAIN_TOKEN)
    private readonly validacionChain: IValidadorMensajeHandler,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket initialized');
    this.logger.log(
      `ChatSessionManager stats: ${JSON.stringify(this.sessionManager.getStats())}`,
    );
  }

  /**
   * Cuando un cliente se conecta
   */
  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // El cliente debe enviar su información después de conectarse con 'authenticate'
  }

  /**
   * Cuando un cliente se desconecta
   */
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const id_user = client.data.id_user as number;
    const id_group = client.data.id_group as number;
    
    // Emitir evento de presencia offline antes de remover sesión
    if (id_user && id_group) {
      const roomName = `group-${id_group}`;
      this.server.to(roomName).emit('user:presence', {
        id_user,
        status: 'offline',
        last_seen: new Date(),
      });
    }
    
    this.sessionManager.removeUserSession(client.id);
  }

  /**
   * Cliente se autentica y se une a un grupo
   * Evento: 'authenticate'
   * Datos: { id_user, id_group } - id_membership es opcional, se busca automáticamente
   */
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id_user: number; id_membership?: number; id_group: number },
  ) {
    try {
      let membershipId = data.id_membership;

      // Si no envían id_membership o es 0, buscarlo automáticamente
      if (!membershipId || membershipId === 0) {
        const membership = await this.prisma.membership.findFirst({
          where: {
            id_user: data.id_user,
            id_group: data.id_group,
          },
        });

        if (!membership) {
          this.logger.error(
            `No membership found for user ${data.id_user} in group ${data.id_group}`,
          );
          return {
            success: false,
            error: 'No eres miembro de este grupo',
          };
        }

        membershipId = membership.id_membership;
        this.logger.log(
          `Auto-detected membership ID: ${membershipId} for user ${data.id_user} in group ${data.id_group}`,
        );
      }

      const socketData: SocketData = {
        id_user: data.id_user,
        id_membership: membershipId,
        id_group: data.id_group,
      };

      // Guardar datos en el socket
      Object.assign(client.data, socketData);

      // Agregar sesión al manager (Singleton)
      this.sessionManager.addUserSession({
        socketId: client.id,
        userId: data.id_user,
        membershipId: membershipId,
        groupId: data.id_group,
        connectedAt: new Date(),
      });

      // Unirse a sala del grupo usando el manager
      const roomName = `group-${data.id_group}`;
      client.join(roomName);
      this.sessionManager.joinGroupRoom(data.id_group, client.id);

      // Unirse a la sala personal del usuario para recibir notificaciones directas
      client.join(`user-${data.id_user}`);

      // Si el grupo es un DM, unirse también al room privado para mensajes 1:1
      const dmGroup = await this.prisma.group.findFirst({
        where: { id_group: data.id_group, is_direct_message: true },
        include: { memberships: { select: { id_user: true } } },
      });
      if (dmGroup && dmGroup.memberships.length === 2) {
        const [u1, u2] = dmGroup.memberships.map((m) => m.id_user).sort((a, b) => a - b);
        const privateRoom = `private-${u1}-${u2}`;
        client.join(privateRoom);
        this.logger.log(`User ${data.id_user} joined private room: ${privateRoom}`);
      }

      // Establecer presencia inicial a 'online'
      this.sessionManager.setUserPresence(data.id_user, 'online');

      this.logger.log(
        `User ${data.id_user} joined group ${data.id_group} with membership ${membershipId} (room: ${roomName})`,
      );

      // Notificar al grupo que un usuario se conectó
      this.server.to(roomName).emit('user:connected', {
        id_user: data.id_user,
        id_membership: membershipId,
        message: 'Usuario conectado',
      });

      // Emitir evento de presencia online
      this.server.to(roomName).emit('user:presence', {
        id_user: data.id_user,
        status: 'online',
        last_seen: new Date(),
      });

      return { success: true, message: 'Authenticated', id_membership: membershipId };
    } catch (error) {
      this.logger.error('Error authenticating:', error);
      return {
        success: false,
        error: 'Error al autenticar',
      };
    }
  }

  /**
   * Recibir nuevo mensaje en tiempo real
   * Evento: 'message:send'
   * Datos: { text_content, attachments?, files? }
   * El id_membership se toma de la sesión autenticada.
   * @ContentModeration intercepta el texto antes del procesamiento.
   */
  @SubscribeMessage('message:send')
  @ContentModeration({ filterProfanity: true, maxLength: 500, logActivity: true })
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { text_content: string; attachments?: string | null; files?: any[] },
  ) {
    try {
      const id_group = client.data.id_group as number;
      const id_membership = client.data.id_membership as number;
      const id_user = client.data.id_user as number;

      this.logger.debug(`handleMessage client.data:`, client.data);

      if (!id_group || !id_membership || !id_user) {
        this.logger.warn(`Usuario no autenticado completamente`, client.data);
        return { error: 'Usuario no autenticado. Llama a authenticate primero.' };
      }

      // Extraer menciones SIN deduplicar para que el handler detecte repeticiones
      const rawText = data.text_content ?? '';
      const rawMatches = rawText.match(/@([\w.\-]+)/g) ?? [];
      const rawMentionNames = rawMatches.map((m) => m.slice(1));
      const mentions = rawMentionNames.map((name, i) => ({
        userId: 0,         // Placeholder; userId real se resuelve post-creación
        displayName: name,
        position: i,
      }));

      // Crear DTO con el id_membership correcto de la sesión
      const createMessageDto = {
        id_membership: id_membership,
        sender_id: id_user,
        text_content: data.text_content,
        attachments: data.attachments || null,
        files: data.files || [],
        mentions,
      };

      // Guardar mensaje en BD
      const message = await this.messagesService.create(createMessageDto);

      if (!message) {
        this.logger.error(`Error creando mensaje - resultado nulo`);
        return { error: 'Error al crear mensaje' };
      }

      const sendAt = message.send_at ?? new Date();

      // Validar que exista el usuario
      if (!message.membership?.user) {
        this.logger.error(
          `Usuario faltante en mensaje ${message.id_message}`,
          { membership: message.membership },
        );
        return { error: 'Error: usuario faltante en la base de datos' };
      }

      // Formar array de archivos con tipos seguros
      const filesArray = (message.files || []).map((file: any) => ({
        id_file: file.id_file,
        url: file.url,
        file_name: file.file_name,
        mime_type: file.mime_type,
        size: file.size ?? undefined,
        created_at: file.created_at ?? undefined,
      }));

      // Formatear mensaje para envio a clientes
      const messageEvent: MessageEventDto = {
        id_message: message.id_message,
        id_membership: message.id_membership!,
        text_content: message.text_content || '',
        send_at: sendAt,
        attachments: message.attachments || null,
        files: filesArray,
        sender_name: message.membership.user.full_name,
        sender_picture: message.membership.user.picture ?? null,
        user: {
          id_user: message.membership.user.id_user,
          full_name: message.membership.user.full_name!,
          picture: message.membership.user.picture ?? undefined,
        },
        group: {
          id_group: message.membership.group?.id_group ?? id_group,
          name: message.membership.group?.name || 'Grupo',
        },
      };

      // Emitir a todos en la sala (incluyendo el remitente)
      const roomName = `group-${id_group}`;
      this.server.to(roomName).emit('message:new', messageEvent);

      // ── Detección de menciones ────────────────────────────────────────────
      const mentionedNames = extractMentions(data.text_content ?? '');
      if (mentionedNames.length > 0) {
        // Buscar usuarios del grupo cuyo nombre coincida con las menciones
        const groupMembers = await this.prisma.membership.findMany({
          where: { id_group },
          include: { user: { select: { id_user: true, full_name: true } } },
        });

        for (const name of mentionedNames) {
          const match = groupMembers.find(
            (m) =>
              m.user &&
              (m.user.full_name.toLowerCase().startsWith(name.toLowerCase()) ||
                m.user.full_name.replace(/\s+/g, '').toLowerCase() === name.toLowerCase()),
          );

          if (match?.user && match.user.id_user !== id_user) {
            // Emitir evento especial de mención al usuario mencionado
            this.server.to(roomName).emit('message:mention', {
              id_message: message.id_message,
              mentioned_user_id: match.user.id_user,
              mentioned_name: match.user.full_name,
              sender_name: messageEvent.sender_name,
              text_content: data.text_content,
              id_group,
              send_at: sendAt,
            });

            this.logger.log(
              `Mention detected: @${name} → user ${match.user.id_user} in group ${id_group}`,
            );
          }
        }
      }

      this.logger.log(
        `Message sent to group ${id_group} - User ${client.data.id_user}`,
      );

      return { success: true, message: messageEvent };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      const response = error?.getResponse?.();
      const codigoError =
        (typeof response === 'object' && response !== null
          ? (response as any).codigoError
          : null) ?? 'ERROR_DESCONOCIDO';
      const errorMessage = error?.message || 'Error al enviar mensaje';
      // Emitir evento de error directamente al socket emisor para que el cliente
      // pueda revertir el mensaje optimista y mostrar el código de error específico
      client.emit('message:send:error', { error: errorMessage, codigoError });
      return { error: errorMessage, codigoError };
    }
  }

  /**
   * Editar un mensaje
   * Evento: 'message:edit'
   * Datos: { id_message, text_content }
   */
  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id_message: number; text_content: string },
  ) {
    try {
      const id_group = client.data.id_group as number;
      const id_user = client.data.id_user as number;

      if (!id_group || !id_user) {
        return { error: 'Usuario no autenticado' };
      }

      // Editar usando el repository que valida ownership
      const updatedMessage = await this.messagesService.editMessage(
        data.id_message,
        id_user,
        data.text_content,
      );

      if (!updatedMessage) {
        return { error: 'No tienes permiso para editar este mensaje' };
      }

      const roomName = `group-${id_group}`;
      this.server.to(roomName).emit('message:edited', {
        id_message: updatedMessage.id_message,
        text_content: updatedMessage.text_content,
        is_edited: updatedMessage.is_edited,
        edited_at: updatedMessage.edited_at,
      });

      this.logger.log(`Message ${data.id_message} edited in group ${id_group}`);

      return { success: true, message: updatedMessage };
    } catch (error) {
      this.logger.error('Error editing message:', error);
      return { error: 'Error al editar mensaje' };
    }
  }

  /**
   * Eliminar un mensaje
   * Evento: 'message:delete'
   * Datos: { id_message }
   */
  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id_message: number },
  ) {
    try {
      const id_group = client.data.id_group as number;
      const id_user = client.data.id_user as number;

      if (!id_group || !id_user) {
        return { error: 'Usuario no autenticado' };
      }

      // Eliminar validando permisos (autor o admin)
      await this.messagesService.remove(data.id_message, id_user);

      const roomName = `group-${id_group}`;
      this.server.to(roomName).emit('message:deleted', {
        id_message: data.id_message,
      });

      this.logger.log(`Message ${data.id_message} deleted in group ${id_group}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting message:', error);
      return { error: error.message || 'Error al eliminar mensaje' };
    }
  }

  /**
   * Usuario escribiendo (indicador de escritura)
   * Evento: 'user:typing'
   * Datos: { id_user, full_name, is_typing }
   */
  @SubscribeMessage('user:typing')
  handleUserTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { is_typing: boolean; full_name?: string },
  ) {
    const id_group = client.data.id_group as number;
    const id_user = client.data.id_user as number;

    if (!id_group) {
      return { error: 'Usuario no autenticado' };
    }

    // Usar full_name del payload o caer en el userName guardado en la sesión del socket
    const full_name: string = data.full_name ?? (client.data.userName as string) ?? 'Usuario';

    const roomName = `group-${id_group}`;
    this.server.to(roomName).emit('user:typing', {
      id_user,
      full_name,
      is_typing: data.is_typing,
    });

    return { success: true };
  }

  /**
   * Obtener mensajes recientes de un grupo
   * Evento: 'loadMessages'
   * Datos: { id_group, limit }
   */
  @SubscribeMessage('loadMessages')
  async handleLoadMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { limit?: number } = {},
  ) {
    try {
      const id_group = client.data.id_group as number;

      if (!id_group) {
        return { error: 'Usuario no autenticado' };
      }

      const result = await this.messagesService.findRecentByGroup(
        id_group,
        data.limit || 50,
      );

      return {
        success: true,
        messages: result.messages, // Ya vienen ordenados (más antiguos primero)
        hasMore: result.hasMore,
      };
    } catch (error) {
      this.logger.error('Error loading messages:', error);
      return { error: 'Error al cargar mensajes' };
    }
  }

  /**
   * Obtener historial de mensajes con paginación
   * Evento: 'messages:history'
   * Datos: { cursor?, limit? }
   */
  @SubscribeMessage('messages:history')
  async handleMessagesHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { cursor?: number; limit?: number } = {},
  ) {
    try {
      const id_group = client.data.id_group as number;

      if (!id_group) {
        return { error: 'Usuario no autenticado' };
      }

      const messages = await this.messagesService.findByGroup(id_group);
      const limit = data.limit || 50;
      const cursor = data.cursor || 0;

      // Paginación simple
      const paginatedMessages = messages.slice(cursor, cursor + limit);
      const hasMore = messages.length > cursor + limit;

      return {
        success: true,
        messages: paginatedMessages,
        cursor: cursor + limit,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Error loading message history:', error);
      return { error: 'Error al cargar historial' };
    }
  }

  /**
   * Salir de un grupo (room)
   * Evento: 'room:leave'
   */
  @SubscribeMessage('room:leave')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const id_group = client.data.id_group as number;

    if (id_group) {
      const roomName = `group-${id_group}`;
      client.leave(roomName);
      this.sessionManager.leaveGroupRoom(id_group, client.id);

      this.logger.log(`User ${client.data.id_user} left group ${id_group}`);

      return { success: true, message: 'Left room' };
    }

    return { error: 'No estás en ningún grupo' };
  }

  /**
   * Buscar mensajes en el grupo
   * Evento: 'messages:search'
   * Datos: { searchTerm }
   */
  @SubscribeMessage('messages:search')
  async handleSearchMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { searchTerm: string },
  ) {
    try {
      const id_group = client.data.id_group as number;

      if (!id_group) {
        return { error: 'Usuario no autenticado' };
      }

      if (!data.searchTerm || data.searchTerm.trim().length < 2) {
        return { error: 'El término de búsqueda debe tener al menos 2 caracteres' };
      }

      const messages = await this.messagesService.searchInGroup(
        id_group,
        data.searchTerm.trim(),
      );

      return {
        success: true,
        messages,
        count: messages.length,
      };
    } catch (error) {
      this.logger.error('Error searching messages:', error);
      return { error: 'Error al buscar mensajes' };
    }
  }

  /**
   * Obtener estadísticas de sesiones
   * Evento: 'session:stats'
   */
  @SubscribeMessage('session:stats')
  handleGetStats(@ConnectedSocket() client: Socket) {
    const stats = this.sessionManager.getStats();
    const id_group = client.data.id_group as number;

    if (id_group) {
      const groupSockets = this.sessionManager.getGroupSockets(id_group);
      return {
        success: true,
        stats,
        currentGroup: {
          id_group,
          connectedUsers: groupSockets.length,
        },
      };
    }

    return { success: true, stats };
  }

  /**
   * Notificar lectura de mensaje (Patrón Observer)
   * Evento: 'message:read'
   * Datos: { id_message, id_user, read_at }
   */
  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageReadDto,
  ) {
    try {
      const id_group = client.data.id_group as number;
      const id_user = client.data.id_user as number;

      if (!id_group || !id_user) {
        return { error: 'Usuario no autenticado' };
      }

      // Emitir evento a todos los usuarios en el room del grupo
      const roomName = `group-${id_group}`;
      this.server.to(roomName).emit('message:read', {
        id_message: data.id_message,
        id_user: data.id_user,
        read_at: data.read_at,
      });

      this.logger.log(
        `Message ${data.id_message} read by user ${data.id_user} in group ${id_group}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Error handling message read:', error);
      return { error: 'Error al procesar lectura de mensaje' };
    }
  }

  /**
   * Broadcast de presencia de usuario (Patrón Observer)
   * Evento: 'user:presence'
   * Datos: { status: 'online' | 'offline' | 'away' }
   */
  @SubscribeMessage('user:presence')
  async handleUserPresence(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: 'online' | 'offline' | 'away' },
  ) {
    try {
      const id_group = client.data.id_group as number;
      const id_user = client.data.id_user as number;

      if (!id_group || !id_user) {
        return { error: 'Usuario no autenticado' };
      }

      // Throttling: verificar si han pasado 5 segundos desde la última emisión
      const now = Date.now();
      const lastEmit = this.presenceThrottle.get(id_user);
      
      if (lastEmit && now - lastEmit < this.PRESENCE_THROTTLE_MS) {
        this.logger.debug(
          `Presence update throttled for user ${id_user} (${now - lastEmit}ms since last)`,
        );
        return { success: true, throttled: true };
      }

      // Actualizar presencia en ChatSessionManager
      this.sessionManager.setUserPresence(id_user, data.status);

      // Actualizar timestamp de throttling
      this.presenceThrottle.set(id_user, now);

      // Emitir evento a todos los usuarios en el room del grupo
      const roomName = `group-${id_group}`;
      this.server.to(roomName).emit('user:presence', {
        id_user,
        status: data.status,
        last_seen: new Date(),
      });

      this.logger.log(
        `User ${id_user} presence changed to ${data.status} in group ${id_group}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Error handling user presence:', error);
      return { error: 'Error al procesar presencia de usuario' };
    }
  }

  /**
   * Notificar actividad de grupo (Patrón Observer)
   * Evento: 'group:activity'
   * Datos: GroupActivityDto
   */
  @SubscribeMessage('group:activity')
  async handleGroupActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GroupActivityDto,
  ) {
    try {
      const id_group = client.data.id_group as number;
      const id_user = client.data.id_user as number;

      if (!id_group || !id_user) {
        return { error: 'Usuario no autenticado' };
      }

      // Validar activity_type
      const validTypes = ['member_joined', 'member_left', 'group_updated'];
      if (!validTypes.includes(data.activity_type)) {
        return { error: 'Tipo de actividad inválido' };
      }

      // Emitir evento a todos los usuarios en el room del grupo
      const roomName = `group-${id_group}`;
      this.server.to(roomName).emit('group:activity', {
        id_group: data.id_group,
        activity_type: data.activity_type,
        actor_id: data.actor_id,
        actor_name: data.actor_name,
        timestamp: data.timestamp,
      });

      this.logger.log(
        `Group activity ${data.activity_type} by user ${data.actor_id} in group ${id_group}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Error handling group activity:', error);
      return { error: 'Error al procesar actividad de grupo' };
    }
  }

  /**
   * Método para emitir a un grupo específico desde otras partes del código
   */
  sendMessageToGroup(id_group: number, event: string, data: any) {
    const roomName = `group-${id_group}`;
    this.server.to(roomName).emit(event, data);
  }

  /**
   * Emitir evento al room del foro de un grupo (subject-{groupId}).
   * Usado por ForumService para forum:vote_updated y forum:answer_accepted.
   */
  sendToSubjectRoom(groupId: number, event: string, data: any) {
    this.server.to(`subject-${groupId}`).emit(event, data);
  }

  /**
   * Emitir evento directamente a un usuario específico (user-{userId}).
   * Requiere que el socket haya hecho join a la sala personal en handleAuthenticate.
   */
  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user-${userId}`).emit(event, data);
  }

  /**
   * Identificar usuario sin necesidad de grupo — une el socket a user-{userId}.
   * Usado por páginas que no tienen contexto de grupo (Eventos, Foro antes de
   * seleccionar materia) para que las notificaciones directas lleguen correctamente.
   */
  @SubscribeMessage('user:identify')
  handleUserIdentify(
    @MessageBody() data: { id_user: number },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.id_user) return { success: false };
    client.join(`user-${data.id_user}`);
    client.data.id_user = data.id_user;

    // Registrar en el session manager para que InAppWebSocketStrategy lo encuentre
    if (!this.sessionManager.getUserSockets(data.id_user).includes(client.id)) {
      this.sessionManager.addUserSession({
        socketId: client.id,
        userId: data.id_user,
        membershipId: 0,
        groupId: 0,
        connectedAt: new Date(),
      });
    }

    this.logger.log(`user:identify → socket ${client.id} identified as user ${data.id_user}`);
    return { success: true };
  }

  /**
   * Unir un socket al room del foro de un grupo.
   * El cliente emite 'forum:join' con { groupId } al abrir la vista del foro.
   */
  @SubscribeMessage('forum:join')
  handleForumJoin(
    @MessageBody() data: { groupId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `subject-${data.groupId}`;
    void client.join(room);
    this.logger.log(`Socket ${client.id} joined forum room ${room}`);
    return { success: true, room };
  }

  /**
   * Obtener usuarios conectados en un grupo
   */
  getGroupConnectedUsers(id_group: number): string[] {
    return this.sessionManager.getGroupSockets(id_group);
  }

  /**
   * Enviar mensaje privado 1:1
   * Evento: 'private:send'
   * Datos: { recipient_id, text_content?, files?, mentions? }
   * Requiere autenticación previa con authenticate({ id_user, id_group: dmGroupId }).
   * Emite 'message:new' solo al room private-{min(s,r)}-{max(s,r)}.
   */
  @SubscribeMessage('private:send')
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipient_id: number; text_content?: string; files?: any[]; mentions?: any[] },
  ) {
    try {
      const sender_id = client.data.id_user as number;
      const id_membership = client.data.id_membership as number;

      if (!sender_id || !id_membership) {
        return { error: 'Usuario no autenticado. Llama a authenticate primero.' };
      }

      if (!data.recipient_id) {
        return { error: 'recipient_id es requerido.' };
      }

      if (sender_id === data.recipient_id) {
        return { error: 'No puedes enviarte un mensaje privado a ti mismo.' };
      }

      // Room exclusivo para este par de usuarios
      const [u1, u2] = [sender_id, data.recipient_id].sort((a, b) => a - b);
      const privateRoom = `private-${u1}-${u2}`;

      // Extraer menciones del texto (sin deduplicar — el handler de validación detecta duplicados)
      const rawMatches = (data.text_content ?? '').match(/@([\w.\-]+)/g) ?? [];
      const mentions = rawMatches.map((m, i) => ({
        userId: 0,
        displayName: m.slice(1),
        position: i,
      }));

      const resolvedMentions = data.mentions?.length ? data.mentions : mentions;
      const resolvedFiles = data.files || [];

      // ── Cadena de validación (US-CH01) ────────────────────────────────────
      // Se ejecuta ANTES de persistir para rechazar sin tocar la BD
      const dtoValidacion = {
        text_content: data.text_content,
        sender_id,
        recipient_id: data.recipient_id,
        mentions: resolvedMentions,
        files: resolvedFiles.map((f: any) => ({
          url: f.url,
          name: f.file_name,
          mimeType: f.mime_type,
          size: f.size,
        })),
      };

      const resultado = this.validacionChain.manejar(dtoValidacion);
      if (!resultado.valido) {
        client.emit('message:send:error', {
          error: resultado.mensaje ?? resultado.codigoError,
          codigoError: resultado.codigoError,
        });
        return { error: resultado.mensaje, codigoError: resultado.codigoError };
      }

      // ── Decoradores Sprint 3 ───────────────────────────────────────────────
      // Generan rendered_content para enriquecer el evento emitido al cliente
      let msgObj: any = new BaseMessage(data.text_content || '', sender_id, new Date());
      if (resolvedFiles.length > 0) {
        msgObj = new FileMessageDecorator(
          msgObj,
          resolvedFiles.map((f: any) => ({
            url: f.url,
            name: f.file_name,
            mimeType: f.mime_type,
            size: f.size,
          })),
        );
      }
      if (resolvedMentions.length > 0) {
        msgObj = new MentionMessageDecorator(msgObj, resolvedMentions);
      }
      const rendered_content = msgObj.render();

      const createMessageDto = {
        id_membership,
        sender_id,
        recipient_id: data.recipient_id,
        text_content: data.text_content,
        attachments: null,
        files: resolvedFiles,
        mentions: resolvedMentions,
      };

      const message = await this.messagesService.create(createMessageDto);

      if (!message) {
        return { error: 'Error al crear el mensaje privado.' };
      }

      if (!message.membership?.user) {
        return { error: 'Error: usuario faltante en la base de datos.' };
      }

      const filesArray = (message.files || []).map((file: any) => ({
        id_file: file.id_file,
        url: file.url,
        file_name: file.file_name,
        mime_type: file.mime_type,
        size: file.size ?? undefined,
        created_at: file.created_at ?? undefined,
      }));

      const messageEvent = {
        id_message: message.id_message,
        id_membership: message.id_membership!,
        text_content: message.text_content || '',
        rendered_content,
        send_at: message.send_at ?? new Date(),
        attachments: message.attachments || null,
        files: filesArray,
        sender_name: message.membership.user.full_name,
        sender_picture: message.membership.user.picture ?? null,
        membership: {
          user: {
            id_user: message.membership.user.id_user,
            full_name: message.membership.user.full_name!,
            picture: message.membership.user.picture ?? undefined,
          },
          group: {
            id_group: message.membership.group?.id_group ?? 0,
            name: message.membership.group?.name || '',
          },
        },
      };

      // Emitir exclusivamente al room privado — solo los dos participantes del DM están en él
      this.server.to(privateRoom).emit('message:new', messageEvent);
      this.logger.log(`Private message ${message.id_message} sent to room ${privateRoom}`);

      return { success: true, message: messageEvent };
    } catch (error) {
      this.logger.error('Error sending private message:', error);
      const response = error?.getResponse?.();
      const codigoError =
        (typeof response === 'object' && response !== null
          ? (response as any).codigoError
          : null) ?? 'ERROR_DESCONOCIDO';
      const errorMessage = error?.message || 'Error al enviar mensaje privado';
      client.emit('message:send:error', { error: errorMessage, codigoError });
      return { error: errorMessage, codigoError };
    }
  }

  /**
   * Verificar si un usuario está online
   */
  isUserOnline(userId: number): boolean {
    return this.sessionManager.isUserOnline(userId);
  }
}

// ── Helper: extrae nombres de menciones del texto ─────────────────────────
function extractMentions(text: string): string[] {
  const matches = text.match(/@([\w.\-]+)/g);
  if (!matches) return [];
  // Quitar el @ y deduplicar
  return [...new Set(matches.map((m) => m.slice(1)))];
}
