import React from 'react';
import { View, Text, Image, Pressable, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';
import { BaseMessage } from './decorators/BaseMessage';
import { WithFileAttachment } from './decorators/withFileAttachment';
import { WithMentions } from './decorators/withMentions';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  isAdmin: boolean;
  showSenderInfo?: boolean;
  currentUserName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onFilePress?: (file: { id_file: number; file_name: string }) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  isAdmin,
  showSenderInfo = false,
  currentUserName,
  onEdit,
  onDelete,
  onFilePress,
}) => {
  const hasFiles = (message.files?.length ?? 0) > 0;
  const hasText = !!message.text_content?.trim();

  const showOptions = () => {
    const options: any[] = [];
    if (isOwnMessage && onEdit) options.push({ text: 'Editar', onPress: onEdit });
    if ((isOwnMessage || isAdmin) && onDelete) {
      options.push({
        text: 'Eliminar',
        style: 'destructive' as const,
        onPress: () =>
          Alert.alert('Confirmar eliminación', '¿Eliminar este mensaje?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', onPress: onDelete, style: 'destructive' },
          ]),
      });
    }
    options.push({ text: 'Cancelar', style: 'cancel' as const });
    if (options.length > 1) Alert.alert('Opciones', '', options);
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

  // ── Contenido base: texto con menciones ───────────────────────────────────
  const baseContent = hasText ? (
    <Pressable
      onLongPress={showOptions}
      style={[styles.bubble, isOwnMessage ? styles.mineBubble : styles.theirsBubble]}
    >
      <BaseMessage text={message.text_content} isOwnMessage={isOwnMessage} />
    </Pressable>
  ) : null;

  // ── Decorador 1: archivos adjuntos ────────────────────────────────────────
  const withFiles = (
    <WithFileAttachment files={message.files ?? []} onFilePress={onFilePress}>
      {baseContent}
    </WithFileAttachment>
  );

  // ── Decorador 2: mención al usuario actual ────────────────────────────────
  const withMentionHighlight = (
    <WithMentions text={message.text_content ?? ''} currentUserName={currentUserName}>
      {withFiles}
    </WithMentions>
  );

  return (
    <View style={[styles.wrapper, isOwnMessage ? styles.mineWrapper : styles.theirsWrapper]}>

      {/* Información del remitente */}
      {showSenderInfo && (
        <View style={[styles.senderInfo, isOwnMessage && styles.senderInfoMine]}>
          {message.sender_picture ? (
            <Image
              source={{ uri: message.sender_picture }}
              style={[styles.avatar, isOwnMessage && styles.avatarMine]}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, isOwnMessage && styles.avatarMine]}>
              <Ionicons name="person" size={14} color="#fff" />
            </View>
          )}
          <Text style={styles.senderName}>
            {message.sender_name ?? message.membership?.user?.full_name ?? 'Usuario'}
          </Text>
        </View>
      )}

      {/* Contenido decorado */}
      {withMentionHighlight}

      {/* Footer: hora + editado */}
      <View style={styles.footer}>
        <Text style={[styles.time, isOwnMessage && styles.mineTime]}>
          {formatTime(message.send_at)}
        </Text>
        {message.is_edited && (
          <Text style={[styles.editedBadge, isOwnMessage && styles.mineTime]}>
            editado
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: '80%',
  },
  mineWrapper: { alignSelf: 'flex-end' },
  theirsWrapper: { alignSelf: 'flex-start' },

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
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  avatarMine: { marginRight: 0, marginLeft: 6 },
  avatarPlaceholder: {
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 13,
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

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  time: { fontSize: 11, color: '#9CA3AF' },
  mineTime: { color: '#4a4a4a' },
  editedBadge: { fontSize: 11, fontStyle: 'italic', color: '#9CA3AF' },
});
