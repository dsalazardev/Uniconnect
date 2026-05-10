import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './InviteMemberModal.module.css';

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: (userId: number) => Promise<void>;
  isInviting?: boolean;
  availableUsers?: Array<{ id_user: number; full_name: string; email?: string }>;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  visible,
  onClose,
  onInvite,
  isInviting = false,
  availableUsers = [],
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      setError('Debes seleccionar un usuario');
      return;
    }

    setError(null);

    try {
      await onInvite(selectedUserId);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar la invitación');
    }
  };

  const handleClose = () => {
    setSelectedUserId(null);
    setError(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Invitar Miembro</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleInvite} className={styles.form}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Selecciona un usuario *</label>
            <select
              className={styles.input}
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              disabled={isInviting}
            >
              <option value="">Selecciona un usuario</option>
              {availableUsers.map((user) => {
                const label = user.email
                  ? `${user.full_name} (${user.email})`
                  : user.full_name;
                const truncated = label.length > 50
                  ? label.substring(0, 47) + '...'
                  : label;
                return (
                  <option key={user.id_user} value={user.id_user} title={label}>
                    {truncated}
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={handleClose}
              disabled={isInviting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submitButton}`}
              disabled={isInviting}
            >
              {isInviting ? 'Invitando...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
