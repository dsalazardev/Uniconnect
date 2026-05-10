import React from 'react';
import styles from './BaseMessage.module.css';

interface BaseMessageProps {
  text: string;
  isOwnMessage: boolean;
}

interface Segment {
  value: string;
  isMention: boolean;
}

export function parseMentions(text: string): Segment[] {
  const MENTION_REGEX = /@[\w.\-]+/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ value: text.slice(lastIndex, match.index), isMention: false });
    }
    segments.push({ value: match[0], isMention: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ value: text.slice(lastIndex), isMention: false });
  }

  return segments;
}

export const BaseMessage: React.FC<BaseMessageProps> = ({ text, isOwnMessage }) => {
  if (!text?.trim()) return null;

  const segments = parseMentions(text);

  return (
    <span className={`${styles.text} ${isOwnMessage ? styles.ownText : styles.theirText}`}>
      {segments.map((seg, i) =>
        seg.isMention ? (
          <span key={i} className={styles.mention}>
            {seg.value}
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </span>
  );
};
