import React from 'react';
import { AtSign } from 'lucide-react';
import styles from './WithMentions.module.css';

interface WithMentionsProps {
  text: string;
  currentUserName?: string;
  children: React.ReactNode;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function containsMention(text: string, fullName: string): boolean {
  if (!text || !fullName) return false;
  const firstName = fullName.split(' ')[0];
  const noSpaces = fullName.replace(/\s+/g, '');
  const pattern = new RegExp(`@(${escapeRegex(firstName)}|${escapeRegex(noSpaces)})\\b`, 'i');
  return pattern.test(text);
}

export const WithMentions: React.FC<WithMentionsProps> = ({
  text,
  currentUserName,
  children,
}) => {
  const isMentioned = currentUserName
    ? containsMention(text, currentUserName)
    : false;

  if (!isMentioned) {
    return <>{children}</>;
  }

  return (
    <div className={styles.mentionWrapper}>
      <div className={styles.mentionAccent} />
      <div className={styles.content}>
        {children}
      </div>
      <AtSign size={14} className={styles.mentionIcon} color="#38BDF8" />
    </div>
  );
};
