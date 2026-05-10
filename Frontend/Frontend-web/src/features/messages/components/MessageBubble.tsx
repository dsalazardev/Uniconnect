import React from 'react';
import { User } from 'lucide-react';
import type { Message } from '@uniconnect/shared';
import { BaseMessage } from './BaseMessage';
import { WithFileAttachment } from './WithFileAttachment';
import { WithMentions } from './WithMentions';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSenderInfo?: boolean;
  currentUserName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onFilePress?: (file: { id_file: number; file_name: string }) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showSenderInfo = false,
  currentUserName,
  onEdit,
  onDelete,
  onFilePress,
}) => {
  const hasText = !!message.text_content?.trim();

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const baseContent = hasText ? (
    <div className={`${styles.bubble} ${isOwnMessage ? styles.mineBubble : styles.theirsBubble}`}>
      <BaseMessage text={message.text_content} isOwnMessage={isOwnMessage} />
    </div>
  ) : null;

  const withFiles = (
    <WithFileAttachment files={message.files ?? []} onFilePress={onFilePress}>
      {baseContent}
    </WithFileAttachment>
  );

  const withMentionHighlight = (
    <WithMentions text={message.text_content ?? ''} currentUserName={currentUserName}>
      {withFiles}
    </WithMentions>
  );

  return (
    <div className={`${styles.wrapper} ${isOwnMessage ? styles.mineWrapper : styles.theirsWrapper}`}>
      {showSenderInfo && (
        <div className={`${styles.senderInfo} ${isOwnMessage ? styles.senderInfoMine : ''}`}>
          {message.sender_picture ? (
            <img
              src={message.sender_picture}
              alt=""
              className={`${styles.avatar} ${isOwnMessage ? styles.avatarMine : ''}`}
            />
          ) : (
            <div className={`${styles.avatar} ${styles.avatarPlaceholder} ${isOwnMessage ? styles.avatarMine : ''}`}>
              <User size={14} color="#fff" />
            </div>
          )}
          <span className={styles.senderName}>
            {message.sender_name ?? message.membership?.user?.full_name ?? 'Usuario'}
          </span>
        </div>
      )}

      {withMentionHighlight}

      <div className={styles.footer}>
        <span className={`${styles.time} ${isOwnMessage ? styles.mineTime : ''}`}>
          {formatTime(message.send_at)}
        </span>
        {message.is_edited && (
          <span className={`${styles.editedBadge} ${isOwnMessage ? styles.mineTime : ''}`}>
            editado
          </span>
        )}
      </div>
    </div>
  );
};
