# Design: US-O02 - Observer Pattern para Chat en Tiempo Real

## Architecture Overview

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLEAN ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DOMAIN LAYER (Entities + Business Rules)              │   │
│  │  - ISubject<T>, IObserver<T> (interfaces)              │   │
│  │  - ChatSubject (concrete subject)                      │   │
│  │  - NO dependencies on outer layers                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ▲                                     │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  APPLICATION LAYER (Use Cases)                         │   │
│  │  - MessagesService (coordinator)                       │   │
│  │  - Orchestrates: decorators → attach → persist → notify│   │
│  │  - Depends on: Domain interfaces                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ▲                                     │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  INFRASTRUCTURE LAYER (External Interfaces)            │   │
│  │  - PrivateChatObserver, GroupChatObserver              │   │
│  │  - ChatGateway (Socket.IO)                             │   │
│  │  - Implements: Domain interfaces                       │   │
│  │  - Depends on: Domain + Application                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Observer Pattern Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     MESSAGE FLOW DIAGRAM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Client (Web/Mobile)                                        │
│     │                                                           │
│     ▼                                                           │
│  2. ChatGateway.handleMessage()                                │
│     │ - Validate authentication                                │
│     │ - Extract socket data                                    │
│     ▼                                                           │
│  3. MessagesService.sendMessage(messageDto)                    │
│     │                                                           │
│     ├─▶ 3.1 applyDecorators(message)                           │
│     │   - @ContentModeration                                   │
│     │   - File attachments (placeholder)                       │
│     │   - Mentions (placeholder)                               │
│     │                                                           │
│     ├─▶ 3.2 enrichMessageWithRoomInfo(message)                 │
│     │   - Determine chat_type (private/group)                  │
│     │   - Calculate room_id                                    │
│     │                                                           │
│     ├─▶ 3.3 attachObserverForChatType(chat_type)               │
│     │   - if 'private': chatSubject.attach(privateChatObserver)│
│     │   - if 'group': chatSubject.attach(groupChatObserver)    │
│     │                                                           │
│     ├─▶ 3.4 persistMessage(message)                            │
│     │   - Save to database via Prisma                          │
│     │   - Get generated id_message                             │
│     │                                                           │
│     └─▶ 3.5 chatSubject.notify(decoratedMessage)               │
│         │                                                       │
│         ▼                                                       │
│  4. ChatSubject.notify()                                       │
│     │ - Iterate observers[]                                    │
│     │ - Call observer.update(message)                          │
│     │ - Clear observers[] (one-time pattern)                   │
│     ▼                                                           │
│  5. Observer.update(message)                                   │
│     │ - PrivateChatObserver OR GroupChatObserver               │
│     │ - Validate chat_type                                     │
│     │ - Enrich with metadata                                   │
│     ▼                                                           │
│  6. ChatGateway.emitToRoom(roomId, 'NUEVO_MENSAJE', data)     │
│     │ - server.to(roomId).emit(event, data)                    │
│     ▼                                                           │
│  7. All Clients in Room Receive Message                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Domain Layer Design

### ISubject Interface

```typescript
// src/messages/domain/observer/interfaces/subject.interface.ts

/**
 * Subject interface for Observer pattern.
 * Manages a list of observers and notifies them of state changes.
 * 
 * @template T - Type of data to be notified to observers
 */
export interface ISubject<T> {
  /**
   * Attach an observer to receive notifications.
   * @param observer - Observer to attach
   */
  attach(observer: IObserver<T>): void;

  /**
   * Detach an observer from receiving notifications.
   * @param observer - Observer to detach
   */
  detach(observer: IObserver<T>): void;

  /**
   * Notify all attached observers with data.
   * @param data - Data to send to observers
   */
  notify(data: T): void;
}
```

### IObserver Interface

```typescript
// src/messages/domain/observer/interfaces/observer.interface.ts

/**
 * Observer interface for Observer pattern.
 * Receives notifications from subjects.
 * 
 * @template T - Type of data received from subject
 */
export interface IObserver<T> {
  /**
   * Update method called by subject when notifying.
   * @param data - Data received from subject
   */
  update(data: T): void;
}
```

### ChatSubject Implementation

```typescript
// src/messages/domain/observer/chat-subject.ts

import { Injectable, Logger } from '@nestjs/common';
import { ISubject, IObserver } from './interfaces';
import { MessageDto } from '../../dto/message.dto';

/**
 * Concrete implementation of ISubject for chat messages.
 * Manages a list of observers and notifies them when messages are processed.
 */
@Injectable()
export class ChatSubject implements ISubject<MessageDto> {
  private readonly observers: IObserver<MessageDto>[] = [];
  private readonly logger = new Logger(ChatSubject.name);

  /**
   * Attach an observer to receive message notifications.
   * 
   * @param observer - The observer to attach
   */
  attach(observer: IObserver<MessageDto>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
      this.logger.log(`Observer attached. Total observers: ${this.observers.length}`);
    }
  }

  /**
   * Detach an observer from receiving message notifications.
   * 
   * @param observer - The observer to detach
   */
  detach(observer: IObserver<MessageDto>): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
      this.logger.log(`Observer detached. Total observers: ${this.observers.length}`);
    }
  }

  /**
   * Notify all attached observers with the message data.
   * Clears observers after notification (one-time use pattern).
   * 
   * @param data - The message data to send to observers
   */
  notify(data: MessageDto): void {
    this.logger.log(`Notifying ${this.observers.length} observers with message: ${data.id_message}`);
    
    for (const observer of this.observers) {
      try {
        observer.update(data);
      } catch (error) {
        this.logger.error(`Observer notification failed: ${error.message}`, error.stack);
      }
    }
    
    // Clear observers after notification (one-time use pattern)
    this.observers.length = 0;
    this.logger.log('All observers cleared after notification');
  }

  /**
   * Get the current number of attached observers.
   * Useful for testing and debugging.
   */
  getObserverCount(): number {
    return this.observers.length;
  }
}
```

## Infrastructure Layer Design

### PrivateChatObserver

```typescript
// src/messages/infrastructure/observers/private-chat.observer.ts

import { Injectable, Logger } from '@nestjs/common';
import { IObserver } from '../../domain/observer/interfaces';
import { MessageDto } from '../../dto/message.dto';
import { ChatGateway } from '../gateways/chat.gateway';

/**
 * Observer for private chat messages.
 * Handles emission of messages to private chat rooms only.
 */
@Injectable()
export class PrivateChatObserver implements IObserver<MessageDto> {
  private readonly logger = new Logger(PrivateChatObserver.name);

  constructor(private readonly chatGateway: ChatGateway) {}

  /**
   * Update method called when a private message needs to be emitted.
   * Only processes messages with chat_type 'private'.
   * 
   * @param message - The message data to process
   */
  update(message: MessageDto): void {
    if (message.chat_type !== 'private') {
      this.logger.warn(
        `PrivateChatObserver received non-private message (type: ${message.chat_type}). Ignoring.`
      );
      return;
    }

    if (!message.room_id) {
      this.logger.error('Private message missing room_id. Cannot emit.');
      return;
    }

    const roomId = message.room_id; // Format: private-{userId1}-{userId2}
    this.logger.log(`Emitting private message to room: ${roomId}`);

    // Enrich message with channel metadata
    const enrichedMessage = {
      ...message,
      timestamp: new Date(),
      channel: 'private',
    };

    try {
      this.chatGateway.emitToRoom(roomId, 'NUEVO_MENSAJE', enrichedMessage);
      this.logger.log(`Successfully emitted private message ${message.id_message} to room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to emit private message to room ${roomId}: ${error.message}`, error.stack);
    }
  }
}
```

### GroupChatObserver

```typescript
// src/messages/infrastructure/observers/group-chat.observer.ts

import { Injectable, Logger } from '@nestjs/common';
import { IObserver } from '../../domain/observer/interfaces';
import { MessageDto } from '../../dto/message.dto';
import { ChatGateway } from '../gateways/chat.gateway';

/**
 * Observer for group chat messages.
 * Handles emission of messages to group chat rooms only.
 */
@Injectable()
export class GroupChatObserver implements IObserver<MessageDto> {
  private readonly logger = new Logger(GroupChatObserver.name);

  constructor(private readonly chatGateway: ChatGateway) {}

  /**
   * Update method called when a group message needs to be emitted.
   * Only processes messages with chat_type 'group'.
   * 
   * @param message - The message data to process
   */
  update(message: MessageDto): void {
    if (message.chat_type !== 'group') {
      this.logger.warn(
        `GroupChatObserver received non-group message (type: ${message.chat_type}). Ignoring.`
      );
      return;
    }

    if (!message.room_id) {
      this.logger.error('Group message missing room_id. Cannot emit.');
      return;
    }

    const roomId = message.room_id; // Format: group-{groupId}
    this.logger.log(`Emitting group message to room: ${roomId}`);

    // Enrich message with channel metadata
    const enrichedMessage = {
      ...message,
      timestamp: new Date(),
      channel: 'group',
    };

    try {
      this.chatGateway.emitToRoom(roomId, 'NUEVO_MENSAJE', enrichedMessage);
      this.logger.log(`Successfully emitted group message ${message.id_message} to room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to emit group message to room ${roomId}: ${error.message}`, error.stack);
    }
  }
}
```

### ChatGateway

```typescript
// src/messages/infrastructure/gateways/chat.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

interface ClientData {
  userId: number;
  rooms: string[];
}

interface AuthenticatePayload {
  token: string;
  userId: number;
}

interface JoinRoomPayload {
  roomId: string;
}

/**
 * WebSocket Gateway for real-time chat functionality.
 * Handles client connections, authentication, and room management.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedClients = new Map<string, ClientData>();

  /**
   * Handle new client connections.
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnections.
   */
  handleDisconnect(client: Socket): void {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Handle client authentication.
   * TODO: Integrate with existing JWT validation from AuthModule.
   */
  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AuthenticatePayload,
  ): void {
    try {
      // TODO: Validate JWT token using existing AuthModule
      // For now, we'll accept any userId for development
      this.connectedClients.set(client.id, {
        userId: data.userId,
        rooms: [],
      });

      client.emit('authenticated', { success: true, userId: data.userId });
      this.logger.log(`Client authenticated: ${client.id}, User: ${data.userId}`);
    } catch (error) {
      client.emit('authenticated', { success: false, error: error.message });
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
    }
  }

  /**
   * Handle client joining a room.
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomPayload,
  ): void {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        client.emit('room_joined', {
          roomId: data.roomId,
          success: false,
          error: 'Client not authenticated',
        });
        return;
      }

      client.join(data.roomId);
      clientData.rooms.push(data.roomId);

      client.emit('room_joined', { roomId: data.roomId, success: true });
      this.logger.log(`Client ${client.id} (User: ${clientData.userId}) joined room: ${data.roomId}`);
    } catch (error) {
      client.emit('room_joined', {
        roomId: data.roomId,
        success: false,
        error: error.message,
      });
      this.logger.error(`Join room failed for client ${client.id}: ${error.message}`);
    }
  }

  /**
   * Public method for observers to emit messages to specific rooms.
   * This is the key method that observers will use to send messages.
   * 
   * @param roomId - The room to emit to
   * @param event - The event name
   * @param data - The data to emit
   */
  emitToRoom(roomId: string, event: string, data: unknown): void {
    this.server.to(roomId).emit(event, data);
    this.logger.log(`Emitted ${event} to room ${roomId}`);
  }

  /**
   * Get connected clients count for monitoring.
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get client data for a specific client (useful for testing).
   */
  getClientData(clientId: string): ClientData | undefined {
    return this.connectedClients.get(clientId);
  }
}
```

## Application Layer Design

### MessagesService

```typescript
// src/messages/application/messages.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ChatSubject } from '../domain/observer/chat-subject';
import { PrivateChatObserver } from '../infrastructure/observers/private-chat.observer';
import { GroupChatObserver } from '../infrastructure/observers/group-chat.observer';
import { MessageDto } from '../dto/message.dto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Main coordinator service for message processing.
 * Orchestrates the Observer pattern flow: decorators → attach → persist → notify.
 */
@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly chatSubject: ChatSubject,
    private readonly privateChatObserver: PrivateChatObserver,
    private readonly groupChatObserver: GroupChatObserver,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Main method to send a message through the Observer pattern.
   * 
   * @param messageDto - The message data to process
   * @returns The saved message with generated ID
   */
  async sendMessage(messageDto: MessageDto): Promise<MessageDto> {
    try {
      this.logger.log(`Processing message: ${messageDto.text_content?.substring(0, 50)}...`);

      // 1. Apply decorators (placeholder implementation)
      const decoratedMessage = this.applyDecorators(messageDto);

      // 2. Determine chat type and room ID
      const enrichedMessage = this.enrichMessageWithRoomInfo(decoratedMessage);

      // 3. Attach appropriate observer based on chat type
      this.attachObserverForChatType(enrichedMessage.chat_type);

      // 4. Persist message to database
      const savedMessage = await this.persistMessage(enrichedMessage);

      // 5. Notify observers (this will emit via Socket.IO)
      this.chatSubject.notify(savedMessage);

      this.logger.log(`Message sent successfully: ${savedMessage.id_message}`);
      return savedMessage;
    } catch (error) {
      this.logger.error(`Send message failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Apply decorators to the message (placeholder implementation).
   * TODO: Implement actual decorators (content moderation, spam check, etc.)
   * 
   * @param message - The original message
   * @returns The message with decorator metadata
   */
  private applyDecorators(message: MessageDto): MessageDto {
    this.logger.log('Applying decorators (placeholder implementation)');

    return {
      ...message,
      decorators_applied: ['content_filter', 'spam_check'],
      processed_at: new Date(),
    };
  }

  /**
   * Enrich message with chat type and room ID information.
   * 
   * @param message - The decorated message
   * @returns The message with chat_type and room_id
   */
  private enrichMessageWithRoomInfo(message: MessageDto): MessageDto {
    if (message.id_membership) {
      // Group chat: has membership ID
      return {
        ...message,
        chat_type: 'group',
        room_id: `group-${message.id_membership}`,
      };
    } else if (message.sender_id && message.recipient_id) {
      // Private chat: has sender and recipient IDs
      // Ensure consistent room naming regardless of sender/recipient order
      const [userId1, userId2] = [message.sender_id, message.recipient_id].sort((a, b) => a - b);
      return {
        ...message,
        chat_type: 'private',
        room_id: `private-${userId1}-${userId2}`,
      };
    } else {
      throw new Error('Message must have either id_membership (group) or sender_id/recipient_id (private)');
    }
  }

  /**
   * Attach the appropriate observer based on chat type.
   * 
   * @param chatType - The type of chat ('private' or 'group')
   */
  private attachObserverForChatType(chatType: 'private' | 'group' | undefined): void {
    if (chatType === 'private') {
      this.chatSubject.attach(this.privateChatObserver);
      this.logger.log('Attached PrivateChatObserver');
    } else if (chatType === 'group') {
      this.chatSubject.attach(this.groupChatObserver);
      this.logger.log('Attached GroupChatObserver');
    } else {
      throw new Error(`Invalid chat type: ${chatType}`);
    }
  }

  /**
   * Persist the message to the database.
   * 
   * @param message - The enriched message
   * @returns The saved message with generated ID
   */
  private async persistMessage(message: MessageDto): Promise<MessageDto> {
    try {
      const savedMessage = await this.prisma.message.create({
        data: {
          id_membership: message.id_membership,
          text_content: message.text_content,
          send_at: message.send_at || new Date(),
          attachments: message.attachments,
          is_edited: message.is_edited || false,
        },
      });

      this.logger.log(`Message persisted with ID: ${savedMessage.id_message}`);

      return {
        ...message,
        id_message: savedMessage.id_message,
        send_at: savedMessage.send_at,
      };
    } catch (error) {
      this.logger.error(`Failed to persist message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get observer count for monitoring/debugging.
   */
  getObserverCount(): number {
    return this.chatSubject.getObserverCount();
  }
}
```

## Data Transfer Objects

### MessageDto

```typescript
// src/messages/dto/message.dto.ts

import { IsString, IsBoolean, IsOptional, IsNumber, IsDate, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for chat messages.
 * Contains all necessary fields for message processing and emission.
 */
export class MessageDto {
  @IsOptional()
  @IsNumber()
  id_message?: number;

  @IsOptional()
  @IsNumber()
  id_membership?: number;

  @IsOptional()
  @IsNumber()
  sender_id?: number;

  @IsOptional()
  @IsNumber()
  recipient_id?: number;

  @IsString()
  text_content: string;

  @IsDate()
  @Type(() => Date)
  send_at: Date;

  @IsOptional()
  @IsString()
  attachments?: string;

  @IsBoolean()
  is_edited: boolean;

  // Calculated fields
  @IsIn(['private', 'group'])
  chat_type: 'private' | 'group';

  @IsString()
  room_id: string;

  // Decorator metadata
  @IsOptional()
  @IsString({ each: true })
  decorators_applied?: string[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  processed_at?: Date;
}
```

## Module Configuration

```typescript
// src/messages/messages.module.ts

import { Module } from '@nestjs/common';
import { MessagesService } from './application/messages.service';
import { MessagesController } from './messages.controller';
import { ChatGateway } from './infrastructure/gateways/chat.gateway';
import { ChatSubject } from './domain/observer/chat-subject';
import { PrivateChatObserver } from './infrastructure/observers/private-chat.observer';
import { GroupChatObserver } from './infrastructure/observers/group-chat.observer';
import { PrismaModule } from '../prisma/prisma.module';
import { MessageRepository } from './message.repository';

/**
 * Messages module that provides real-time chat functionality using the Observer pattern.
 * Includes WebSocket gateway, message service, and observer implementations.
 * Also includes traditional REST API endpoints and repository pattern.
 */
@Module({
  imports: [PrismaModule],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    ChatGateway,
    ChatSubject,
    PrivateChatObserver,
    GroupChatObserver,
    MessageRepository,
  ],
  exports: [MessagesService, ChatGateway, MessageRepository],
})
export class MessagesModule {}
```

## Testing Strategy

### Unit Tests Structure

```typescript
// src/messages/__tests__/chat-subject.spec.ts
describe('ChatSubject', () => {
  describe('attach', () => {
    it('should attach observer to the subject');
    it('should not attach duplicate observers');
    it('should attach multiple different observers');
  });

  describe('detach', () => {
    it('should detach observer from the subject');
    it('should handle detaching non-existent observer');
    it('should detach only the specified observer');
  });

  describe('notify', () => {
    it('should notify all attached observers');
    it('should clear observers after notification');
    it('should handle observer errors gracefully');
    it('should not notify if no observers attached');
  });
});

// src/messages/__tests__/observers.spec.ts
describe('Chat Observers', () => {
  describe('PrivateChatObserver', () => {
    it('should emit private message to correct room');
    it('should ignore non-private messages');
    it('should handle missing room_id');
    it('should handle gateway errors gracefully');
  });

  describe('GroupChatObserver', () => {
    it('should emit group message to correct room');
    it('should ignore non-group messages');
    it('should handle missing room_id');
    it('should handle gateway errors gracefully');
  });

  describe('Channel Isolation', () => {
    it('should ensure strict separation between private and group channels');
  });
});

// src/messages/__tests__/chat.gateway.spec.ts
describe('ChatGateway', () => {
  it('should emit to specific room');
  it('should handle client authentication');
  it('should allow clients to join rooms');
  it('should handle client disconnection');
});
```

## Performance Considerations

### Memory Management
- Clear observers after each notification (one-time pattern)
- Use WeakMap for client data if needed
- Implement connection pooling for database

### Latency Optimization
- Async/await for non-blocking operations
- Parallel processing where possible
- Minimize database queries

### Scalability
- Stateless design for horizontal scaling (future)
- Redis adapter for Socket.IO (future)
- Message queue for high-volume scenarios (future)

## Security Considerations

### Authentication
- JWT validation before joining rooms
- User can only join authorized rooms
- Token refresh mechanism

### Authorization
- Validate user permissions for each room
- Prevent cross-room message leakage
- Rate limiting for message sending

### Data Validation
- Strict DTO validation with class-validator
- Sanitize user input
- Content moderation for inappropriate content

## Migration Strategy

### Phase 1: Parallel Implementation
- Keep existing `messages.gateway.ts` functional
- Implement new Observer pattern alongside
- Both systems coexist

### Phase 2: Testing & Validation
- Comprehensive unit and integration tests
- Performance benchmarking
- Security audit

### Phase 3: Gradual Rollout
- Feature flag for new system
- Monitor metrics and errors
- Rollback plan if needed

### Phase 4: Legacy Deprecation
- Migrate all clients to new system
- Remove old gateway
- Clean up unused code
