import { useState, useEffect, useCallback, useRef } from 'react';
import { messagesService } from '../services';
import { websocketService } from '../services/websocket.service';
import { filesService } from '../services/files.service';
import { Message, MessageSendData, TypingData } from '../types';
import { getServerUrl } from '../config/websocket.config';

interface UseChatOptions {
  groupId: number;
  userId: number;
  token: string;
  userFullName: string;
  serverUrl?: string;
}

export const useChat = ({ groupId, userId, token, userFullName, serverUrl }: UseChatOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMessagesRef = useRef<Set<string>>(new Set());
  // Cursor: id_message del mensaje más antiguo cargado
  const oldestMessageIdRef = useRef<number | null>(null);

  // Cargar mensajes iniciales
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      const { messages: data, hasMore: more } = await messagesService.getRecentMessages(groupId, 50);
      
      // inverted FlatList: el índice 0 debe ser el más nuevo → invertir el array
      setMessages(data ? [...data].reverse() : []);
      setHasMore(more);
      // Cursor: id del mensaje más antiguo = el último del array original (antes de invertir)
      if (data && data.length > 0) {
        oldestMessageIdRef.current = data[0].id_message;
      }
      setError(null);
    } catch (err: any) {
      console.error(`[useChat] ❌ Error al cargar mensajes:`, err);
      setError(err.message || 'Error al cargar mensajes');
    } finally {
      setLoading(false);
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

    // Cargar mensajes iniciales
    loadMessages();

    // Cleanup
    return () => {
      websocketService.off('user:connected', handleUserConnected);
      websocketService.off('message:new', handleNewMessage);
      websocketService.off('message:edited', handleMessageEdited);
      websocketService.off('message:deleted', handleMessageDeleted);
      websocketService.off('user:typing', handleUserTyping);
      websocketService.off('message:mention', handleMention);
    };
  }, [groupId, userId, serverUrl, loadMessages]);

  // Enviar mensaje (ya no necesita id_membership, el backend lo toma de la sesión)
  const sendMessage = useCallback((text: string, attachments: string = '') => {
    if (!text.trim()) return;

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
    
    // Marcar este mensaje como pendiente
    pendingMessagesRef.current.add(text.trim());

    // Enviar al servidor
    websocketService.sendMessage(messageData);
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

  return {
    messages,
    loading,
    error,
    isConnected,
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
  };
};
