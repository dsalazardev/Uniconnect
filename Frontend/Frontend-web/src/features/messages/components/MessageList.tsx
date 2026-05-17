import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Pencil, Trash2, MoreVertical, X, Loader2 } from 'lucide-react';
import type { Message } from '@uniconnect/shared';
import { BaseMessage } from './BaseMessage';
import { WithFileAttachment } from './WithFileAttachment';
import { PollDecorator } from './PollDecorator';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  loading?: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: number) => void;
  onFilePress?: (file: { id_file: number; file_name: string }) => void;
  onVotePoll?: (pollId: number, optionId: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  loading = false,
  onEdit,
  onDelete,
  onFilePress,
  onVotePoll,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keep refs current so observer callbacks always see latest values without stale closures
  const isLoadingMoreRef = useRef(false);
  isLoadingMoreRef.current = isLoadingMore;
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // Deduplicate poll messages: keep only the first occurrence of each poll.id
  const dedupedMessages = React.useMemo(() => {
    const seenPollIds = new Set<number>();
    return messages.filter((msg) => {
      if (!msg.poll) return true;
      if (seenPollIds.has(msg.poll.id)) return false;
      seenPollIds.add(msg.poll.id);
      return true;
    });
  }, [messages]);

  // Auto-scroll only when the newest message (index 0) changes — not when old messages are appended
  const prevNewestIdRef = useRef<number | null>(null);
  useEffect(() => {
    const newestId = messages[0]?.id_message ?? null;
    if (newestId !== prevNewestIdRef.current) {
      prevNewestIdRef.current = newestId;
      if (!isLoadingMoreRef.current && containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [messages]);

  // IntersectionObserver on sentinel: fires when user scrolls up to the oldest messages
  // With flex-direction:column-reverse the sentinel is last in DOM → topmost visually
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMoreRef.current) {
          onLoadMoreRef.current?.();
        }
      },
      { threshold: 0 },
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

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
      {dedupedMessages.map((message) => {

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
                  {message.poll ? (
                    <PollDecorator
                      poll={message.poll}
                      currentUserId={currentUserId}
                      onVote={onVotePoll}
                    />
                  ) : message.text_content ? (
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
      {/* Sentinel and loader are last in DOM → topmost visually with flex-direction:column-reverse */}
      {hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
      {isLoadingMore && (
        <div className={styles.topLoader}>
          <Loader2 size={18} className={styles.topLoaderSpinner} />
        </div>
      )}
    </div>
  );
};
