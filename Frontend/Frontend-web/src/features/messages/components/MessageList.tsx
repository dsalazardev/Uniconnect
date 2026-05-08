import React, { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import type { Message } from '@uniconnect/shared';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  loading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className={styles.messagesContainer}>
      {messages.map((message) => {
        const isOwnMessage = message.membership?.user?.id_user === currentUserId;
        const senderName = message.membership?.user?.full_name || 'Usuario';

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
            <div
              className={`${styles.bubble} ${
                isOwnMessage ? styles.ownBubble : styles.otherBubble
              }`}
            >
              <p className={styles.messageText}>{message.text_content}</p>
              <span className={styles.timestamp}>
                {new Date(message.send_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
