import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Pencil, Trash2, MoreVertical, X } from 'lucide-react';
import type { Message } from '@uniconnect/shared';
import { BaseMessage } from './BaseMessage';
import { WithFileAttachment } from './WithFileAttachment';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  loading?: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: number) => void;
  onFilePress?: (file: { id_file: number; file_name: string }) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  loading = false,
  onEdit,
  onDelete,
  onFilePress,
}) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Cargando mensajes...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <MessageCircle size={48} className={styles.emptyIcon} />
        <p className={styles.emptyText}>No hay mensajes aún</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.messagesContainer}>
      {messages.map((message) => {
        const isOwnMessage = message.membership?.user?.id_user === currentUserId;
        const senderName = message.membership?.user?.full_name || 'Usuario';
        const showActions = isOwnMessage && onEdit && onDelete;
        const isMenuOpen = openMenuId === message.id_message;

        return (
          <div
            key={message.id_message}
            className={`${styles.messageWrapper} ${
              isOwnMessage ? styles.ownMessage : styles.otherMessage
            }`}
          >
            {!isOwnMessage && (
              <span className={styles.senderName}>{senderName}</span>
            )}
            <div className={styles.messageRow}>
              <div
                className={`${styles.bubble} ${
                  isOwnMessage ? styles.ownBubble : styles.otherBubble
                }`}
              >
                <WithFileAttachment files={message.files ?? []} onFilePress={onFilePress}>
                  {message.text_content ? (
                    <BaseMessage text={message.text_content} isOwnMessage={isOwnMessage} />
                  ) : null}
                </WithFileAttachment>
                <div className={styles.messageMeta}>
                  {message.is_edited && (
                    <span className={styles.editedLabel}>Editado</span>
                  )}
                  <span className={styles.timestamp}>
                    {new Date(message.send_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {showActions && (
                <div className={styles.actionsWrapper}>
                  <button
                    className={styles.menuButton}
                    onClick={() => setOpenMenuId(isMenuOpen ? null : message.id_message)}
                    aria-label="Opciones del mensaje"
                  >
                    {isMenuOpen ? <X size={14} /> : <MoreVertical size={14} />}
                  </button>
                  {isMenuOpen && (
                    <div className={styles.actionMenu}>
                      <button
                        className={styles.actionItem}
                        onClick={() => {
                          onEdit(message);
                          setOpenMenuId(null);
                        }}
                      >
                        <Pencil size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        className={`${styles.actionItem} ${styles.actionDanger}`}
                        onClick={() => {
                          onDelete(message.id_message);
                          setOpenMenuId(null);
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
