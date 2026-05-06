import React from 'react';
import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  typingUsers: Array<{ userId: number; userName: string }>;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} está escribiendo...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} y ${typingUsers[1].userName} están escribiendo...`;
    } else {
      return `${typingUsers.length} personas están escribiendo...`;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.dots}>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
      <span className={styles.text}>{getTypingText()}</span>
    </div>
  );
};
