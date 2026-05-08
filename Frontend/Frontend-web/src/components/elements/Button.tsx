import React from 'react';
import { Loader } from 'lucide-react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  ...rest
}) => {
  const classNames = [
    styles.button,
    styles[variant],
    loading ? styles.loading : '',
    disabled ? styles.disabled : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <button className={classNames} disabled={disabled || loading} {...rest}>
      {loading && <Loader size={16} className={styles.spinner} />}
      <span className={loading ? styles.labelHidden : ''}>{children}</span>
    </button>
  );
};
