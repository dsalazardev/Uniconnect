import React from 'react';
import styles from './LoadingSpinner.module.css';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
}) => {
  const dimension = sizeMap[size];

  return (
    <div className={styles.container}>
      <div
        className={styles.spinner}
        style={{ width: dimension, height: dimension }}
      />
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
};
