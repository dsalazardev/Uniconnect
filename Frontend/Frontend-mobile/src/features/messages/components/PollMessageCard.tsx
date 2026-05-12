import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { Poll, PollOption } from '@uniconnect/shared';

interface PollMessageCardProps {
  poll: Poll;
  currentUserId: number;
  onVote?: (pollId: number, optionId: number) => void;
}

export const PollMessageCard: React.FC<PollMessageCardProps> = ({
  poll,
  currentUserId: _currentUserId,
  onVote,
}) => {
  const isClosed = poll.status === 'CLOSED';
  const hasVoted = poll.userVote !== null && poll.userVote !== undefined;
  const totalVotes = poll.options.reduce((sum, o) => sum + o.count, 0);

  const [remaining, setRemaining] = useState(() => getRemaining(poll.closesAt));

  // Countdown tick (every 30s is enough for this use case)
  useEffect(() => {
    if (isClosed) return;
    const id = setInterval(() => setRemaining(getRemaining(poll.closesAt)), 30_000);
    return () => clearInterval(id);
  }, [isClosed, poll.closesAt]);

  const handleVote = (option: PollOption) => {
    if (isClosed || hasVoted || !onVote) return;
    onVote(poll.id, option.id);
  };

  return (
    <View style={styles.wrapper}>
      {/* Header: badge + timer */}
      <View style={styles.header}>
        <View style={isClosed ? styles.badgeClosed : styles.badgeActive}>
          <Text style={isClosed ? styles.badgeClosedText : styles.badgeActiveText}>
            ENCUESTA
          </Text>
        </View>
        <Text style={styles.timer}>
          {isClosed ? 'Cerrada' : remaining}
        </Text>
      </View>

      {/* Question */}
      <Text style={styles.question}>{poll.question}</Text>

      {/* Options */}
      <View style={styles.options}>
        {poll.options.map((option) => {
          const isVoted = poll.userVote === option.id;
          const pct = totalVotes > 0 ? option.percentage : 0;
          const showResults = hasVoted || isClosed;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                isVoted && styles.optionVoted,
                (isClosed || hasVoted) && styles.optionDisabled,
              ]}
              onPress={() => handleVote(option)}
              disabled={isClosed || hasVoted}
              activeOpacity={isClosed || hasVoted ? 1 : 0.7}
            >
              {/* Progress fill */}
              {showResults && (
                <View
                  style={[styles.progressFill, { width: `${pct}%` as any }]}
                />
              )}

              <View style={styles.optionRow}>
                <Text style={styles.optionText}>{option.text}</Text>
                {showResults && (
                  <Text style={[styles.optionPct, isVoted && styles.optionPctVoted]}>
                    {pct.toFixed(0)}%
                  </Text>
                )}
                {isVoted && <Text style={styles.checkMark}> ✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Vote count */}
      <Text style={styles.voteCount}>
        {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
      </Text>
    </View>
  );
};

function getRemaining(closesAt: string): string {
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return 'Cerrando...';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `Cierra en ${hours}h ${minutes}m`;
  if (minutes > 0) return `Cierra en ${minutes}m`;
  return `Cierra en ${totalSeconds}s`;
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.25)',
    borderRadius: 12,
    padding: 12,
    minWidth: 220,
    maxWidth: 300,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badgeActive: {
    backgroundColor: 'rgba(217,185,126,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.45)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeActiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D9B97E',
    letterSpacing: 0.8,
  },
  badgeClosed: {
    backgroundColor: 'rgba(120,120,120,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(120,120,120,0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeClosedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.8,
  },
  timer: {
    fontSize: 11,
    color: '#888',
  },
  question: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f0f0f0',
    lineHeight: 20,
    marginBottom: 4,
  },
  options: {
    gap: 6,
  },
  option: {
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    overflow: 'hidden',
    minHeight: 38,
    justifyContent: 'center',
  },
  optionVoted: {
    borderColor: '#D9B97E',
  },
  optionDisabled: {
    // keeps layout but disables press feedback
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(217,185,126,0.12)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: '#e0e0e0',
  },
  optionPct: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
  },
  optionPctVoted: {
    color: '#D9B97E',
  },
  checkMark: {
    fontSize: 13,
    color: '#D9B97E',
    fontWeight: '700',
  },
  voteCount: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
});
