import { useState, useEffect, useCallback, useRef } from 'react';
import { messagesService } from '../services/messages.service';
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessagesRef = useRef<Set<string>>(new Set()); // Para rastrear mensajes optimistas

  // Cargar mensajes iniciales
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`[useChat] Cargando mensajes del grupo ${groupId}...`);
      const data = await messagesService.getRecentMessages(groupId, 50, token);
      console.log(`[useChat] ✅ Mensajes cargados: ${data?.length || 0} mensajes`);
      // HOOK TRACKER: Verificar si los mensajes traen files
      if (data && data.length > 0) {
        const conArchivos = data.filter((m: any) => m.files && m.files.length > 0);
        console.log(`[Hook Tracker] Mensajes con files: ${conArchivos.length} de ${data.length}`);
        if (conArchivos.length > 0) {
          console.log('[Hook Tracker] Ejemplo de mensaje con files:', JSON.stringify(conArchivos[0], null, 2));
        } else {
          console.log('[Hook Tracker] NINGUNO tiene files. Ejemplo primer mensaje:', JSON.stringify(data[0], null, 2));
        }
      }
      setMessages(data || []);
      setError(null);
    } catch (err: any) {
      console.error(`[useChat] ❌ Error al cargar mensajes:`, err);
      const errorMsg = err.message || 'Error al cargar mensajes';
      console.error(`[useChat] Mensaje de error: ${errorMsg}`);
      console.error(`[useChat] Status: ${err.response?.status}`);
      console.error(`[useChat] Data: ${JSON.stringify(err.response?.data)}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);
  // Conectar al WebSocket
  useEffect(() => {
    // Usar serverUrl proporccionado o la configuración centralizada
    const finalServerUrl = serverUrl || getServerUrl();
    console.log(`[useChat] ========== INICIANDO HOOK ==========`);
    console.log(`[useChat] groupId: ${groupId}, userId: ${userId}`);
    console.log(`[useChat] Conectando a WebSocket en: ${finalServerUrl}`);

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
      console.log('Usuario conectado:', data);
      setIsConnected(true);
    };

    // Escuchar nuevos mensajes
    const handleNewMessage = (rawMessage: any) => {
      // WEBSOCKET TRACKER
      console.log('[WebSocket Tracker] Nuevo mensaje recibido por WS:', JSON.stringify(rawMessage, null, 2));
      console.log('[WebSocket Tracker] Tiene files?:', !!rawMessage.files, '| Cantidad:', rawMessage.files?.length || 0);

      // Normalizar: el gateway emite { user, group, files } pero la UI espera { membership: { user, group }, files }
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

      // Si es un mensaje que ya agregamos optimísticamente, no lo duplicamos
      if (textContent && pendingMessagesRef.current.has(textContent)) {
        pendingMessagesRef.current.delete(textContent);
        // Reemplazar el mensaje temporal con el del servidor (tiene id_message real)
        setMessages((prev) => {
          const tempIndex = prev.findIndex(
            (msg) => msg.id_message < 0 && msg.text_content === message.text_content
          );
          if (tempIndex >= 0) {
            const newMessages = [...prev];
            newMessages[tempIndex] = message;
            return newMessages;
          }
          return [...prev, message];
        });
      } else {
        // Mensaje de otro usuario, mensaje de archivos, o mensaje que no fue optimista
        setMessages((prev) => [...prev, message]);
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

    // Cargar mensajes iniciales
    loadMessages();

    // Cleanup
    return () => {
      websocketService.off('user:connected', handleUserConnected);
      websocketService.off('message:new', handleNewMessage);
      websocketService.off('message:edited', handleMessageEdited);
      websocketService.off('message:deleted', handleMessageDeleted);
      websocketService.off('user:typing', handleUserTyping);
    };
  }, [groupId, userId, token, serverUrl, loadMessages]);

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

    // Agregar mensaje optimista a la UI inmediatamente
    setMessages((prev) => [...prev, optimisticMessage]);
    
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

  // Cargar más mensajes (scroll infinito)
  const loadMoreMessages = useCallback((page: number, limit: number = 20) => {
    websocketService.loadHistory({ page, limit });
  }, []);

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
