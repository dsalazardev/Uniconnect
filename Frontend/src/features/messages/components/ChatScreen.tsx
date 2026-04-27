import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  Keyboard,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble } from './MessageBubble';
import { FilePickerModal } from './FilePickerModal';
import { useChat } from '../hooks/useChat';
import { Message } from '../types';
import { filesService } from '../services/files.service';

interface ChatScreenProps {
  groupId: number;
  userId: number;
  token: string;
  isAdmin: boolean;
  userFullName: string;
  serverUrl?: string;
  group?: {
    id_group: number;
    name: string;
    is_direct_message?: boolean;
    memberships?: Array<{
      id_membership: number;
      id_user: number;
      user: {
        id_user: number;
        full_name: string;
        picture?: string;
        email: string;
      };
    }>;
  };
}

// Emojis populares
const POPULAR_EMOJIS = [
  '😀', '😂', '😍', '😭', '😱', '😴',
  '😤', '😡', '💪', '👍', '👏', '🙏',
  '❤️', '💔', '💖', '💝', '✨', '🔥',
  '👀', '😎', '🤔', '😏', '😊', '😌',
  '😸', '😹', '🐶', '🐱', '🐻', '🐼',
  '🎉', '🎊', '🎈', '🎁', '⭐', '✅',
  '❌', '⚠️', '📝', '📋', '💯', '🙌',
];

export const ChatScreen: React.FC<ChatScreenProps> = ({
  groupId,
  userId,
  token,
  isAdmin,
  userFullName,
  serverUrl,
  group,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determinar si es un chat privado
  const isDirectMessage = group?.is_direct_message ?? false;

  // Obtener el nombre del otro usuario en chats privados
  const getOtherUserName = (): string => {
    if (!isDirectMessage || !group?.memberships) {
      return group?.name ?? 'Chat';
    }

    const otherMember = group.memberships.find(
      (m) => m.id_user !== userId
    );

    return otherMember?.user?.full_name ?? 'Usuario';
  };

  // Nombre a mostrar en el header (se usará desde el componente padre)
  const displayName = isDirectMessage ? getOtherUserName() : group?.name ?? 'Chat';

  // Ocultar botones de administración si es chat privado
  const showAdminButtons = !isDirectMessage && isAdmin;

  const {
    messages,
    loading,
    error,
    isConnected,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    emitTyping,
    downloadFile,
  } = useChat({
    groupId,
    userId,
    token,
    userFullName,
    serverUrl,
  });

  // Auto-scroll al final cuando llegan mensajes nuevos
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Scroll al final cuando aparece el teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;

    sendMessage(inputText);
    setInputText('');
    setIsTyping(false);
    emitTyping(false, userFullName);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText(inputText + emoji);
  };

  const handleFilesSelected = async (files: any[]) => {
    try {
      setUploadingFiles(true);
      console.log(`[ChatScreen] Subiendo ${files.length} archivos...`);

      const uploadedFiles = await filesService.uploadFiles(
        files,
        groupId,
        token
      );

      console.log(`[ChatScreen] Archivos subidos:`, uploadedFiles.length);
      // El backend crea el mensaje automaticamente y lo emite por WebSocket.
      // No necesitamos enviar un mensaje de texto adicional.

      setShowFilePicker(false);
    } catch (error: any) {
      console.error(`[ChatScreen] Error al subir archivos:`, error.message);
      Alert.alert('Error', error.message || 'Error al subir los archivos. Intenta de nuevo.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);

    // Emitir evento de typing
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      emitTyping(true, userFullName);
    }

    // Debounce para dejar de escribir
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitTyping(false, userFullName);
    }, 1000);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.membership?.user?.id_user === userId;
    
    // NUEVO: Estilo corporativo (Slack/Discord)
    // En chats grupales, TODOS los mensajes muestran remitente (incluso los propios)
    // En chats privados, NINGÚN mensaje muestra remitente
    const showSenderInfo = !isDirectMessage;
    
    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        isAdmin={isAdmin}
        showSenderInfo={showSenderInfo}
        onEdit={() => {
          // Implementar lógica de edición (abrir modal con input)
          // Por ahora solo lo dejamos preparado
          console.log('Editar mensaje:', item.id_message);
        }}
        onDelete={() => deleteMessage(item.id_message)}
        onFilePress={downloadFile}
      />
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const typingNames = typingUsers.map((u) => u.full_name).join(', ');
    
    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>
          {typingNames} {typingUsers.length === 1 ? 'está' : 'están'} escribiendo...
        </Text>
      </View>
    );
  };

  // Debug logs
  useEffect(() => {
    console.log(`[ChatScreen] Estado actual:`, {
      loading,
      error,
      messagesCount: messages.length,
      isConnected,
      typingUsersCount: typingUsers.length,
    });
  }, [loading, error, messages.length, isConnected, typingUsers.length]);

  if (loading) {
    console.warn(`[ChatScreen] ⏳ Estado LOADING - Mostrando spinner`);
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  if (error) {
    console.error(`[ChatScreen] ❌ Estado ERROR - Error: ${error}`);
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  console.log(`[ChatScreen] ✅ Renderizando chat con ${messages.length} mensajes`);
  console.log(`[ChatScreen] Renderizando componentes: FlatList + InputContainer`);

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.connectionText}>Reconectando...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id_message.toString()}
        contentContainerStyle={styles.messagesList}
        style={styles.flatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {renderTypingIndicator()}

      <View style={styles.inputContainer}>
        
        <TouchableOpacity 
          style={styles.emojiButton}
          onPress={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <Ionicons name="happy-outline" size={24} color="#D9B97E" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity 
          style={styles.attachButton}
          onPress={() => setShowFilePicker(true)}
        >
          <Ionicons name="attach" size={24} color="#D9B97E" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() ? '#D9B97E' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View style={styles.emojiPickerContainer}>
          <View style={styles.emojiPickerHeader}>
            <Text style={styles.emojiPickerTitle}>Selecciona un emoji</Text>
            <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
              <Ionicons name="close" size={24} color="#D9B97E" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.emojiPickerContent}
            contentContainerStyle={styles.emojiGrid}
          >
            {POPULAR_EMOJIS.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emojiButton2}
                onPress={() => {
                  handleEmojiSelect(emoji);
                  setShowEmojiPicker(false);
                }}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* File Picker Modal */}
      <FilePickerModal
        visible={showFilePicker}
        onClose={() => setShowFilePicker(false)}
        onFilesSelected={handleFilesSelected}
        loading={uploadingFiles}
      />
    </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#363636',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#363636',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#363636',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    gap: 8,
  },
  connectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  flatList: {
    flex: 1,
    backgroundColor: '#363636',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
  },
  typingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#363636',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 8,
  },
  emojiButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emojiPickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  emojiPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emojiPickerContent: {
    backgroundColor: '#363636',
    maxHeight: 400,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-around',
  },
  emojiButton2: {
    width: '20%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 40,
  },
});
