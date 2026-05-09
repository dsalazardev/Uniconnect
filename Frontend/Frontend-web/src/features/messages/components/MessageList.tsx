import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Pencil, Trash2, MoreVertical, X, FileText } from 'lucide-react';
import type { Message } from '@uniconnect/shared';
import styles from './MessageList.module.css';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  loading?: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: number) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  loading = false,
  onEdit,
  onDelete,
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
                {message.text_content && (
                  <p className={styles.messageText}>{message.text_content}</p>
                )}
                {message.files && message.files.length > 0 && (
                  <div className={styles.fileList}>
                    {message.files.map((file) => (
                      <a
                        key={file.id_file}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.fileAttachment}
                      >
                        <FileText size={16} />
                        <span className={styles.fileName}>{file.file_name}</span>
                        <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                      </a>
                    ))}
                  </div>
                )}
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
