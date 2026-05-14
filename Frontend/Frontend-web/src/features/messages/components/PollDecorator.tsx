import React from 'react';
import type { Poll, PollOption } from '@uniconnect/shared';
import styles from './PollDecorator.module.css';

interface PollDecoratorProps {
  poll: Poll;
  currentUserId: number;
  onVote?: (pollId: number, optionId: number) => void;
  children?: React.ReactNode;
}

export const PollDecorator: React.FC<PollDecoratorProps> = ({
  poll,
  currentUserId: _currentUserId,
  onVote,
  children,
}) => {
  const isClosed = poll.status === 'CLOSED';
  const totalVotes = poll.options.reduce((sum, o) => sum + o.count, 0);

  const handleVote = (option: PollOption) => {
    if (isClosed || !onVote) return;
    onVote(poll.id, option.id);
  };

  const remainingMs = new Date(poll.closesAt).getTime() - Date.now();
  const remainingLabel = isClosed
    ? 'Encuesta cerrada'
    : remainingMs > 0
    ? `Cierra en ${formatRemaining(remainingMs)}`
    : 'Cerrando...';

  return (
    <div className={styles.wrapper}>
      {/* Badge */}
      <div className={styles.header}>
        <span className={`${styles.badge} ${isClosed ? styles.badgeClosed : styles.badgeActive}`}>
          ENCUESTA
        </span>
        <span className={styles.timer}>{remainingLabel}</span>
      </div>

      {/* Optional base message text (question from text_content) */}
      {children && <div className={styles.baseContent}>{children}</div>}

      {/* Question */}
      <p className={styles.question}>{poll.question}</p>

      {/* Options */}
      <div className={styles.options}>
        {poll.options.map((option) => {
          const isVoted = poll.userVote === option.id;
          const pct = totalVotes > 0 ? option.percentage : 0;

          return (
            <button
              key={option.id}
              className={`${styles.option} ${isVoted ? styles.optionVoted : ''} ${
                isClosed ? styles.optionDisabled : styles.optionClickable
              }`}
              onClick={() => handleVote(option)}
              disabled={isClosed}
              aria-label={`Votar por ${option.text}`}
            >
              {/* Progress fill behind the row */}
              <div
                className={styles.progressFill}
                style={{ width: `${pct}%` }}
              />
              <span className={styles.optionText}>{option.text}</span>
              <span className={styles.optionPct}>{pct.toFixed(0)}%</span>
              {isVoted && <span className={styles.checkMark}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Vote count */}
      <p className={styles.voteCount}>
        {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
      </p>
    </div>
  );
};

function formatRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}
