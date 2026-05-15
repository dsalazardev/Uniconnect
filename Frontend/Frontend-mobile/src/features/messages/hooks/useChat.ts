import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { messagesService, pollService } from '../services';
import { websocketService } from '../services/websocket.service';
import { filesService } from '../services/files.service';
import { Message, MessageSendData, TypingData } from '../types';
import { getServerUrl } from '../config/websocket.config';
import {
  PollSocketHandler,
  POLL_WS_EVENTS,
  type Poll,
  type PollOption,
  type CreatePollDto,
} from '@uniconnect/shared';

const ERROR_CODE_MESSAGES: Record<string, string> = {
  MSG_TAMANO_EXCEDIDO: 'El mensaje es demasiado largo.',
  MSG_CONTENIDO_VACIO: 'El mensaje no puede estar vacío.',
  MSG_CONTENIDO_INAPROPIADO: 'El mensaje contiene contenido inapropiado.',
  MSG_MENCIONES_EXCEDIDAS: 'Solo puedes mencionar hasta 3 personas por mensaje.',
  MSG_MENCIONES_DUPLICADAS: 'No puedes mencionar a la misma persona más de una vez.',
  MSG_MENCIONES_INVALIDAS: 'Una o más menciones no son válidas.',
  MSG_PERMISOS_INSUFICIENTES: 'No tienes permiso para enviar mensajes en este grupo.',
  MSG_ADJUNTO_TAMANO_EXCEDIDO: 'El archivo supera el límite de 10 MB.',
  MSG_ADJUNTO_TIPO_NO_PERMITIDO: 'Tipo de archivo no permitido.',
};

interface UseChatOptions {
  groupId: number;
  userId: number;
  token: string;
  userFullName: string;
  serverUrl?: string;
  recipientUserId?: number;
}

export const useChat = ({ groupId, userId, token, userFullName, serverUrl, recipientUserId }: UseChatOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pollsState, setPollsState] = useState<Map<number, Poll>>(new Map());
  // Ref actualizado en cada render para que los handlers del WebSocket no tengan closures stale
  const recipientUserIdRef = useRef<number | undefined>(recipientUserId);
  recipientUserIdRef.current = recipientUserId;
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMessagesRef = useRef<Set<string>>(new Set());
  // Cursor: id_message del mensaje más antiguo cargado
  const oldestMessageIdRef = useRef<number | null>(null);
  // ID temporal del último mensaje optimista enviado (para rollback en error)
  const lastOptimisticIdRef = useRef<number | null>(null);
  // Timestamp del mensaje más reciente recibido (para sincronizar mensajes perdidos al reconectar)
  const lastMessageTimestampRef = useRef<number | null>(null);

  // Cargar mensajes iniciales
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      const { messages: data, hasMore: more } = await messagesService.getRecentMessages(groupId, 50);
      
      // inverted FlatList: el índice 0 debe ser el más nuevo → invertir el array
      setMessages(data ? [...data].reverse() : []);
      setHasMore(more);
      if (data && data.length > 0) {
        // Cursor hacia atrás: id del mensaje más antiguo (último antes de invertir)
        oldestMessageIdRef.current = data[0].id_message;
        // Timestamp del más reciente (último del array ordenado ASC = index final)
        const newest = data[data.length - 1];
        lastMessageTimestampRef.current = new Date(newest.send_at).getTime();
      }
      setError(null);
    } catch (err: any) {
      console.error(`[useChat] ❌ Error al cargar mensajes:`, err);
      setError(err.message || 'Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Sincronizar mensajes perdidos durante una desconexión (usa since= para traer solo los nuevos)
  const loadMissedMessages = useCallback(async () => {
    if (!lastMessageTimestampRef.current) return;
    try {
      const { messages: missed } = await messagesService.getRecentMessages(
        groupId,
        50,
        undefined,
        lastMessageTimestampRef.current,
      );
      if (!missed || missed.length === 0) return;

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id_message));
        const newOnes = missed.filter((m) => !existingIds.has(m.id_message));
        if (newOnes.length === 0) return prev;
        const newest = missed[missed.length - 1];
        const ts = new Date(newest.send_at).getTime();
        if (ts > (lastMessageTimestampRef.current ?? 0)) {
          lastMessageTimestampRef.current = ts;
        }
        // Los mensajes llegan ASC del backend; el más reciente va al inicio (FlatList inverted)
        return [...newOnes.reverse(), ...prev];
      });
    } catch (err: any) {
      console.error('[useChat] Error al sincronizar mensajes perdidos:', err.message);
    }
  }, [groupId]);

  // Conectar al WebSocket
  useEffect(() => {
    // Usar serverUrl proporccionado o la configuración centralizada
    const finalServerUrl = serverUrl || getServerUrl();
    
    
    

    if (!websocketService.isConnected()) {
      websocketService.connect(finalServerUrl);
    }

    // Autenticar (el backend busca automáticamente el id_membership)
    websocketService.authenticate({
      id_user: userId,
      id_group: groupId,
    });

    // Escuchar conexión
    const handleUserConnected = (data: any) => {
      setIsConnected(true);
      if (recipientUserIdRef.current && data.id_user === recipientUserIdRef.current) {
        setIsRecipientOnline(true);
      }
    };

    // Escuchar presencia de usuarios — actualiza indicador online del destinatario en DMs
    const handleUserPresence = (data: { id_user: number; status: string }) => {
      if (recipientUserIdRef.current && data.id_user === recipientUserIdRef.current) {
        setIsRecipientOnline(data.status === 'online');
      }
    };

    // Escuchar nuevos mensajes
    const handleNewMessage = (rawMessage: any) => {
      

      // Si tiene archivos pero no texto, es un mensaje de archivo puro — siempre agregar
      const hasFiles = (rawMessage.files?.length ?? 0) > 0;
      const message: Message = {
        id_message: rawMessage.id_message,
        id_membership: rawMessage.id_membership,
        text_content: rawMessage.text_content || '',
        send_at: rawMessage.send_at,
        attachments: rawMessage.attachments || '',
        is_edited: rawMessage.is_edited || false,
        edited_at: rawMessage.edited_at || null,
        files: rawMessage.files || [],
        sender_name: rawMessage.sender_name,
        sender_picture: rawMessage.sender_picture,
        membership: rawMessage.membership || {
          user: rawMessage.user || { id_user: 0, full_name: 'Usuario', picture: '' },
          group: rawMessage.group || { id_group: groupId, name: '' },
        },
      };

      const textContent = (message.text_content || '').trim();

      // Actualizar timestamp del mensaje más reciente
      const msgTs = new Date(message.send_at).getTime();
      if (!lastMessageTimestampRef.current || msgTs > lastMessageTimestampRef.current) {
        lastMessageTimestampRef.current = msgTs;
      }

      // Mensajes con archivos (texto vacío) nunca son optimistas — siempre agregar directamente
      if (hasFiles && !textContent) {
        setMessages((prev) => [message, ...prev]);
        return;
      }

      // Si es un mensaje que ya agregamos optimísticamente, no lo duplicamos
      if (textContent && pendingMessagesRef.current.has(textContent)) {
        pendingMessagesRef.current.delete(textContent);
        setMessages((prev) => {
          const tempIndex = prev.findIndex(
            (msg) => msg.id_message < 0 && msg.text_content === message.text_content
          );
          if (tempIndex >= 0) {
            const newMessages = [...prev];
            newMessages[tempIndex] = message;
            return newMessages;
          }
          return [message, ...prev];
        });
      } else {
        setMessages((prev) => [message, ...prev]);
      }
    };

    // Escuchar ediciones
    const handleMessageEdited = (data: { id_message: number; text_content: string; is_edited: boolean; edited_at: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id_message === data.id_message
            ? { ...msg, text_content: data.text_content, is_edited: data.is_edited, edited_at: data.edited_at }
            : msg
        )
      );
    };

    // Escuchar eliminaciones
    const handleMessageDeleted = (data: { id_message: number }) => {
      setMessages((prev) => prev.filter((msg) => msg.id_message !== data.id_message));
    };

    // Escuchar typing
    const handleUserTyping = (data: TypingData) => {
      if (data.id_user === userId) return; // No mostrar nuestro propio typing
      
      if (data.is_typing) {
        setTypingUsers((prev) => {
          const exists = prev.some((u) => u.id_user === data.id_user);
          return exists ? prev : [...prev, data];
        });
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.id_user !== data.id_user));
      }
    };

    websocketService.onUserConnected(handleUserConnected);
    websocketService.on('user:presence', handleUserPresence);
    websocketService.onNewMessage(handleNewMessage);
    websocketService.onMessageEdited(handleMessageEdited);
    websocketService.onMessageDeleted(handleMessageDeleted);
    websocketService.onUserTyping(handleUserTyping);

    // Escuchar menciones al usuario actual
    const handleMention = (data: {
      id_message: number;
      mentioned_user_id: number;
      sender_name: string;
      text_content: string;
      id_group: number;
    }) => {
      if (data.mentioned_user_id === userId) {
        
        // El resaltado visual lo maneja WithMentions en MessageBubble.
        // Aquí se puede disparar una notificación push o badge en el futuro.
      }
    };
    websocketService.on('message:mention', handleMention);

    // Poll WebSocket listeners vía PollSocketHandler compartido
    const pollHandler = new PollSocketHandler(
      (pollId: number, options: PollOption[]) => {
        setPollsState((prev) => {
          const existing = prev.get(pollId);
          if (!existing) return prev;
          const next = new Map(prev);
          next.set(pollId, { ...existing, options });
          return next;
        });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.poll?.id === pollId ? { ...msg, poll: { ...msg.poll!, options } } : msg
          )
        );
      },
      (pollId: number, options: PollOption[], closedAt: string) => {
        setPollsState((prev) => {
          const existing = prev.get(pollId);
          if (!existing) return prev;
          const next = new Map(prev);
          next.set(pollId, { ...existing, options, status: 'CLOSED' });
          return next;
        });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.poll?.id === pollId
              ? { ...msg, poll: { ...msg.poll!, options, status: 'CLOSED' } }
              : msg
          )
        );
        void closedAt;
      }
    );

    const handlePollVoteUpdated = (payload: any) => pollHandler.handleVoteUpdated(payload);
    const handlePollClosed = (payload: any) => pollHandler.handlePollClosed(payload);

    // Encuesta nueva: añadirla al chat como mensaje sintético (igual que web)
    const handlePollCreated = (payload: { poll: Poll; senderId: number; senderName: string }) => {
      const syntheticId = -(1_000_000_000 + payload.poll.id);
      const syntheticMessage: Message = {
        id_message: syntheticId,
        id_membership: -1,
        text_content: '',
        send_at: new Date().toISOString(),
        attachments: '',
        is_edited: false,
        edited_at: null,
        files: [],
        poll: payload.poll,
        sender_name: payload.senderName,
        sender_picture: null,
        membership: {
          user: { id_user: payload.senderId, full_name: payload.senderName, picture: '' },
          group: { id_group: groupId, name: '' },
        },
      };
      setMessages((prev) => {
        const alreadyPresent = prev.some(
          (m) => m.id_message === syntheticId || m.poll?.id === payload.poll.id
        );
        if (alreadyPresent) return prev;
        return [syntheticMessage, ...prev];
      });
    };

    websocketService.on(POLL_WS_EVENTS.VOTE_UPDATED, handlePollVoteUpdated);
    websocketService.on(POLL_WS_EVENTS.CLOSED, handlePollClosed);
    websocketService.on('poll:created', handlePollCreated);

    // Escuchar errores de validación al enviar mensaje
    const handleSendError = (data: { error: string; codigoError: string }) => {
      // Revertir el mensaje optimista si existe
      if (lastOptimisticIdRef.current !== null) {
        setMessages((prev) =>
          prev.filter((msg) => msg.id_message !== lastOptimisticIdRef.current)
        );
        lastOptimisticIdRef.current = null;
      }
      // Limpiar el texto del pendingRef (puede haber quedado sin confirmar)
      pendingMessagesRef.current.clear();

      const userMessage =
        ERROR_CODE_MESSAGES[data.codigoError] ?? data.error ?? 'Error al enviar el mensaje.';
      Alert.alert('No se pudo enviar', userMessage);
    };
    websocketService.on('message:send:error', handleSendError);

    // Registrar callback de reconexión para sincronizar mensajes perdidos
    websocketService.setOnReconnectCallback(() => {
      loadMissedMessages();
    });

    // Cargar mensajes iniciales
    loadMessages();

    // Cleanup
    return () => {
      // Bug 3 fix: notificar al servidor que el usuario salió del chat
      websocketService.emit('user:presence', { status: 'offline' });
      websocketService.off('user:connected', handleUserConnected);
      websocketService.off('user:presence', handleUserPresence);
      websocketService.off('message:new', handleNewMessage);
      websocketService.off('message:edited', handleMessageEdited);
      websocketService.off('message:deleted', handleMessageDeleted);
      websocketService.off('user:typing', handleUserTyping);
      websocketService.off('message:mention', handleMention);
      websocketService.off(POLL_WS_EVENTS.VOTE_UPDATED, handlePollVoteUpdated);
      websocketService.off(POLL_WS_EVENTS.CLOSED, handlePollClosed);
      websocketService.off('poll:created', handlePollCreated);
      websocketService.off('message:send:error', handleSendError);
      websocketService.setOnReconnectCallback(null);
    };
  }, [groupId, userId, serverUrl, loadMessages, loadMissedMessages]);

  // Enviar mensaje (ya no necesita id_membership, el backend lo toma de la sesión)
  // Retorna false si la validación falla (para que el input no se limpie)
  const sendMessage = useCallback((text: string, attachments: string = ''): boolean => {
    if (!text.trim()) return false;
    if (text.trim().length > 500) {
      Alert.alert('No se pudo enviar', ERROR_CODE_MESSAGES.MSG_TAMANO_EXCEDIDO);
      return false;
    }

    // Validación de menciones en el cliente
    const rawMentions = (text.match(/@([\w.\-]+)/g) ?? []).map((m) => m.slice(1).toLowerCase());
    if (rawMentions.length > 0) {
      const unicos = new Set(rawMentions);
      if (unicos.size < rawMentions.length) {
        Alert.alert('No se pudo enviar', ERROR_CODE_MESSAGES.MSG_MENCIONES_DUPLICADAS);
        return false;
      }
      if (unicos.size > 3) {
        Alert.alert('No se pudo enviar', ERROR_CODE_MESSAGES.MSG_MENCIONES_EXCEDIDAS);
        return false;
      }
    }

    const messageData: MessageSendData = {
      text_content: text.trim(),
      attachments,
    };

    // Crear mensaje optimista para mostrar inmediatamente en la UI
    const optimisticMessage: Message = {
      id_message: -Date.now(), // ID temporal negativo
      id_membership: -1, // Temporal
      text_content: text.trim(),
      attachments,
      send_at: new Date().toISOString(),
      is_edited: false,
      edited_at: null,
      sender_name: userFullName,
      sender_picture: null, // No tenemos la foto en el hook, pero el fallback funcionará
      membership: {
        user: {
          id_user: userId,
          full_name: userFullName,
          picture: '', // No tenemos la foto, pero no es crítico
        },
        group: {
          id_group: groupId,
          name: '', // No es necesario para el renderizado
        },
      },
    };

    // Agregar mensaje optimista al inicio (índice 0 = más nuevo con inverted)
    setMessages((prev) => [optimisticMessage, ...prev]);

    // Guardar ID temporal para poder revertirlo si el servidor rechaza el mensaje
    lastOptimisticIdRef.current = optimisticMessage.id_message;

    // Marcar este mensaje como pendiente
    pendingMessagesRef.current.add(text.trim());

    // Enviar al servidor
    websocketService.sendMessage(messageData);
    return true;
  }, [userId, userFullName, groupId]);

  // Editar mensaje
  const editMessage = useCallback((messageId: number, newText: string) => {
    if (!newText.trim()) return;

    websocketService.editMessage({
      id_message: messageId,
      text_content: newText.trim(),
    });
  }, []);

  // Eliminar mensaje
  const deleteMessage = useCallback((messageId: number) => {
    websocketService.deleteMessage({
      id_message: messageId,
    });
  }, []);

  // Emitir typing indicator con debounce
  const emitTyping = useCallback((isTyping: boolean, fullName: string) => {
    // Limpiar timeout previo
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    websocketService.emitTyping({
      id_user: userId,
      full_name: fullName,
      is_typing: isTyping,
    });

    // Si está escribiendo, programar el "dejó de escribir" después de 3 segundos
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        websocketService.emitTyping({
          id_user: userId,
          full_name: fullName,
          is_typing: false,
        });
      }, 3000);
    }
  }, [userId]);

  // Cargar mensajes más antiguos (scroll hacia arriba — paginación por cursor)
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || oldestMessageIdRef.current === null) return;

    setIsLoadingMore(true);
    try {
      const { messages: older, hasMore: more } = await messagesService.getRecentMessages(
        groupId,
        50,
        oldestMessageIdRef.current,
      );
      

      if (older.length > 0) {
        // Con inverted: los más antiguos van al FINAL del array
        setMessages((prev) => [...prev, ...older.reverse()]);
        oldestMessageIdRef.current = older[0].id_message;
      }
      setHasMore(more);
    } catch (err: any) {
      console.error('[useChat] Error al cargar más mensajes:', err.message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [groupId, isLoadingMore, hasMore]);

  // Buscar mensajes
  const searchMessages = useCallback((query: string) => {
    websocketService.searchMessages({ query });
  }, []);

  // Descargar y abrir archivo con Presigned URL
  const downloadFile = useCallback(async (file: { id_file: number; file_name: string }) => {
    await filesService.downloadAndOpenFile(file, token);
  }, [token]);

  // Crear encuesta en el grupo
  const createPoll = useCallback(async (dto: CreatePollDto) => {
    await pollService.createPoll(groupId, dto);
  }, [groupId]);

  // Registrar o cambiar voto — optimismo completo: userVote + porcentajes al instante
  const castVote = useCallback(async (pollId: number, optionId: number) => {
    let prevPoll: Poll | undefined;

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.poll?.id !== pollId) return msg;
        prevPoll = msg.poll;

        const prevVote = msg.poll.userVote ?? null;
        const isNewVote = prevVote === null;
        const currentTotal = msg.poll.options.reduce((s, o) => s + o.count, 0);
        const newTotal = isNewVote ? currentTotal + 1 : currentTotal;

        const newOptions = msg.poll.options.map((o) => {
          let count = o.count;
          if (o.id === optionId) count += 1;
          if (!isNewVote && o.id === prevVote && prevVote !== optionId) count -= 1;
          return {
            ...o,
            count,
            percentage: newTotal > 0 ? Math.round((count / newTotal) * 100) : 0,
          };
        });

        return { ...msg, poll: { ...msg.poll!, options: newOptions, userVote: optionId } };
      })
    );

    try {
      const updated = await pollService.castVote(pollId, optionId);
      setMessages((prev) =>
        prev.map((msg) => (msg.poll?.id === pollId ? { ...msg, poll: updated } : msg))
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.poll?.id === pollId && prevPoll ? { ...msg, poll: prevPoll } : msg
        )
      );
      Alert.alert('Encuesta', err?.response?.data?.message || 'Error al registrar el voto.');
    }
  }, []);

  return {
    messages,
    loading,
    error,
    isConnected,
    isRecipientOnline,
    typingUsers,
    hasMore,
    isLoadingMore,
    sendMessage,
    editMessage,
    deleteMessage,
    emitTyping,
    loadMoreMessages,
    searchMessages,
    reloadMessages: loadMessages,
    downloadFile,
    castVote,
    createPoll,
    pollsState,
  };
};
