import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  isAdmin: boolean;
  showSenderInfo?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onFilePress?: (file: { id_file: number; file_name: string }) => void;
}

// Combo blindado: Linking nativo primero, WebBrowser como plan B
const handleOpenFile = async (file: { id_file: number; file_name: string }, onFilePress?: (file: { id_file: number; file_name: string }) => void) => {
  console.log('[MessageBubble] Archivo presionado:', file.file_name);
  
  if (onFilePress) {
    // Delegar al controlador/servicio (arquitectura MVC Local)
    onFilePress(file);
  } else {
    console.warn('[MessageBubble] No hay handler onFilePress configurado');
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  isAdmin,
  showSenderInfo = false,
  onEdit,
  onDelete,
  onFilePress,
}) => {
  const isMine = isOwnMessage;

  const showOptions = () => {
    const options = [];

    if (isOwnMessage && onEdit) {
      options.push({
        text: 'Editar',
        onPress: onEdit,
      });
    }

    if ((isOwnMessage || isAdmin) && onDelete) {
      options.push({
        text: 'Eliminar',
        onPress: () => {
          Alert.alert(
            'Confirmar eliminacion',
            'Estas seguro de que deseas eliminar este mensaje?',
            [
              { text: 'Cancelar', style: 'cancel' as const },
              { text: 'Eliminar', onPress: onDelete, style: 'destructive' as const },
            ]
          );
        },
        style: 'destructive' as const,
      });
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel' as const,
    });

    if (options.length > 1) {
      Alert.alert('Opciones', '', options);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // FUNCION RENDERIZADORA A PRUEBA DE FALLOS
  const renderFiles = () => {
    if (!message.files || message.files.length === 0) {
      return null;
    }

    console.log('[UI Render] Pintando archivos del mensaje:', message.id_message, 'Cantidad:', message.files.length);

    return (
      <View style={styles.filesGlobalContainer}>
        {message.files.map((file) => {
          const mime = file.mime_type || '';
          const isImage = mime.includes('image');

          console.log(`[UI Render] Archivo: ${file.file_name} | Es imagen: ${isImage}`);

          return (
            <View key={`file-${file.id_file}`} style={styles.whatsappFileContainer}>
              {isImage ? (
                /* =========================================
                   DISENO DE IMAGEN ESTILO WHATSAPP
                   ========================================= */
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: file.url }} style={styles.whatsappImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.whatsappDownloadOverlay}
                    onPress={() => handleOpenFile(file, onFilePress)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="arrow-down-circle" size={60} color="rgba(255,255,255,0.85)" />
                  </TouchableOpacity>
                </View>
              ) : (
                /* =========================================
                   DISENO DE DOCUMENTO PDF ESTILO WHATSAPP
                   ========================================= */
                <TouchableOpacity
                  style={styles.whatsappDocRow}
                  onPress={() => handleOpenFile(file, onFilePress)}
                  activeOpacity={0.7}
                >
                  <View style={styles.docIconWrapper}>
                    <Ionicons name="document-text" size={30} color="#fff" />
                  </View>

                  <View style={styles.docInfo}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {file.file_name || 'Documento adjunto'}
                    </Text>
                    <Text style={styles.docSize}>
                      {file.size ? (file.size / 1024 / 1024).toFixed(2) : '0.00'} MB
                    </Text>
                  </View>

                  <View style={styles.downloadIconWrapper}>
                    <Ionicons name="download-outline" size={28} color="#54656f" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.messageWrapper, isMine ? styles.mineWrapper : styles.theirsWrapper]}>

      {/* Información del remitente (solo si showSenderInfo es true) */}
      {showSenderInfo && (
        <View style={[
          styles.senderInfo,
          isMine && styles.senderInfoMine
        ]}>
          {message.sender_picture ? (
            <Image
              source={{ uri: message.sender_picture }}
              style={[styles.senderAvatar, isMine && styles.senderAvatarMine]}
            />
          ) : (
            <View style={[
              styles.senderAvatar,
              styles.avatarPlaceholder,
              isMine && styles.senderAvatarMine
            ]}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          )}
          <Text style={styles.senderName}>
            {message.sender_name || message.membership?.user?.full_name || 'Usuario'}
          </Text>
        </View>
      )}

      {/* TEXTO NORMAL */}
      {message.text_content ? (
        <Pressable
          onLongPress={showOptions}
          style={[styles.bubble, isMine ? styles.mineBubble : styles.theirsBubble]}
        >
          <Text style={[styles.messageText, isMine ? styles.mineText : styles.theirsText]}>
            {message.text_content}
          </Text>
        </Pressable>
      ) : null}

      {/* ARCHIVOS (LLAMADA DIRECTA A LA FUNCION) */}
      {renderFiles()}

      {/* Footer: hora + editado */}
      <View style={styles.footer}>
        <Text style={[styles.time, isMine && styles.mineTime]}>
          {formatTime(message.send_at)}
        </Text>
        {message.is_edited && (
          <Text style={[styles.editedBadge, isMine && styles.mineTime]}>
            editado
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal del mensaje - SIN overflow hidden, SIN height fijo
  messageWrapper: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: '80%',
  },
  mineWrapper: {
    alignSelf: 'flex-end',
  },
  theirsWrapper: {
    alignSelf: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingLeft: 4,
  },
  senderInfoMine: {
    flexDirection: 'row-reverse',
    paddingLeft: 0,
    paddingRight: 4,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  senderAvatarMine: {
    marginRight: 0,
    marginLeft: 6,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D9B97E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D9B97E',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  mineBubble: {
    backgroundColor: '#D9B97E',
    borderBottomRightRadius: 4,
  },
  theirsBubble: {
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  mineText: {
    color: '#1a1a1a',
  },
  theirsText: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    marginRight: 4,
  },
  mineTime: {
    color: '#4a4a4a',
  },
  editedBadge: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#9CA3AF',
  },

  // ========= ESTILOS DE ARCHIVOS ESTILO WHATSAPP =========
  filesGlobalContainer: {
    marginTop: 6,
    width: '100%',
  },
  whatsappFileContainer: {
    marginBottom: 8,
  },

  // ESTILOS IMAGEN
  imageWrapper: {
    position: 'relative',
    width: 240,
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#d9d9d9',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  whatsappImage: {
    width: '100%',
    height: '100%',
  },
  whatsappDownloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // ESTILOS DOCUMENTO
  whatsappDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    padding: 12,
    width: 280,
    borderWidth: 1,
    borderColor: '#e1e5e8',
    elevation: 1,
  },
  docIconWrapper: {
    backgroundColor: '#FF5722',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  docName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111b21',
    marginBottom: 3,
  },
  docSize: {
    fontSize: 13,
    color: '#667781',
  },
  downloadIconWrapper: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
