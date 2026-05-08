import React from 'react';
import { Modal } from './elements';
import { AlertTriangle } from 'lucide-react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title = 'Confirmar',
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal visible={visible} onClose={onCancel} title={title}>
      <div className={styles.container}>
        <div className={styles.iconContainer}>
          <AlertTriangle
            size={48}
            className={
              variant === 'danger' ? styles.dangerIcon :
              variant === 'warning' ? styles.warningIcon :
              styles.infoIcon
            }
          />
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={
              variant === 'danger' ? styles.dangerButton :
              variant === 'warning' ? styles.warningButton :
              styles.infoButton
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
