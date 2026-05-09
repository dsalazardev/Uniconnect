import React, { useState } from 'react';
import { Modal } from '@/components/elements';
import type { GroupMembership } from '@uniconnect/shared';
import { useTransferOwnership } from '../hooks/useTransferOwnership';
import { showToast } from '@/lib/toast';
import { User, Shield, X, Loader } from 'lucide-react';
import styles from './TransferOwnershipModal.module.css';

interface TransferOwnershipModalProps {
  visible: boolean;
  groupId: number;
  groupName?: string;
  members: GroupMembership[];
  currentOwnerId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  visible,
  groupId,
  groupName,
  members,
  currentOwnerId,
  onClose,
  onSuccess,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const transferOwnership = useTransferOwnership();

  const eligibleMembers = members.filter((m) => m.id_user !== currentOwnerId);

  const handleTransfer = () => {
    if (!selectedMemberId) return;
    transferOwnership.mutate(
      { groupId, newOwnerId: selectedMemberId },
      {
        onSuccess: () => {
          showToast.success('Propuesta enviada', 'El candidato debe aceptar la transferencia antes de que puedas salir del grupo.');
          onSuccess?.();
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'No se pudo enviar la propuesta.';
          showToast.error('Error', message);
        },
      }
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Transferir Propiedad">
      <div className={styles.container}>
        <div className={styles.infoBox}>
          <Shield size={20} className={styles.infoIcon} />
          <p className={styles.infoText}>
            Selecciona un miembro para proponerle la administración. Recibirá una notificación y deberá aceptar antes de que el cambio sea efectivo. No podrás salir del grupo hasta que acepte.
          </p>
        </div>

        {eligibleMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <User size={48} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No hay miembros disponibles para transferir la propiedad</p>
            <p className={styles.emptySubtext}>Debes tener al menos un miembro en el grupo</p>
          </div>
        ) : (
          <>
            <div className={styles.memberList}>
              {eligibleMembers.map((member) => (
                <label
                  key={member.id_user}
                  className={`${styles.memberCard} ${
                    selectedMemberId === member.id_user ? styles.selected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="transfer-candidate"
                    value={member.id_user}
                    checked={selectedMemberId === member.id_user}
                    onChange={() => setSelectedMemberId(member.id_user)}
                    className={styles.radio}
                  />
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>
                      {member.user?.full_name || `Usuario #${member.id_user}`}
                    </span>
                    {member.role === 'admin' && (
                      <span className={styles.adminBadge}>Admin</span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className={styles.actions}>
              <button className={styles.cancelButton} onClick={onClose}>
                Cancelar
              </button>
              <button
                className={styles.transferButton}
                onClick={handleTransfer}
                disabled={!selectedMemberId || transferOwnership.isPending}
              >
                {transferOwnership.isPending ? (
                  <Loader size={16} className={styles.spinner} />
                ) : (
                  'Proponer administrador'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
