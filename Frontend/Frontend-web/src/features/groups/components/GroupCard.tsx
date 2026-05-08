import React from 'react';
import type { Group } from '@uniconnect/shared';
import { authStore } from '@/features/auth/store/AuthStore';
import { Users, Pencil, Loader, Trash2, User, Star, Shield } from 'lucide-react';
import styles from './GroupCard.module.css';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onPress,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const membersCount = group._count?.memberships || 0;
  const currentUserId = authStore.user?.id_user;

  const isOwner = group.owner_id === currentUserId;
  const userMembership = group.memberships?.find((m) => m.id_user === currentUserId);
  const isAdmin = userMembership?.is_admin || false;
  const canManage = isOwner || isAdmin;

  return (
    <div className={styles.card} onClick={onPress}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Users size={16} className={styles.icon} />
          <div className={styles.headerInfo}>
            <h3 className={styles.groupName}>{group.name}</h3>
            <p className={styles.courseName}>{group.course?.name}</p>
            <p className={styles.programName}>{group.course?.program?.name}</p>
          </div>
        </div>

        {canManage && (
          <div className={styles.actions}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className={styles.actionButton}
              disabled={isDeleting}
              aria-label="Editar grupo"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={styles.actionButton}
              disabled={isDeleting}
              aria-label="Eliminar grupo"
            >
              {isDeleting ? <Loader size={16} /> : <Trash2 size={16} />}
            </button>
          </div>
        )}
      </div>

      {group.description && (
        <p className={styles.description}>{group.description}</p>
      )}

      <div className={styles.footer}>
        <div className={styles.membersInfo}>
          <User size={14} className={styles.footerIcon} />
          <span className={styles.membersText}>
            {membersCount} {membersCount === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>
        {isOwner && (
          <div className={styles.roleIndicator}>
            <Star size={14} className={styles.roleIcon} />
            <span className={styles.roleText}>Propietario</span>
          </div>
        )}
        {isAdmin && !isOwner && (
          <div className={styles.roleIndicatorAdmin}>
            <Shield size={14} className={styles.roleIcon} />
            <span className={styles.roleText}>Admin</span>
          </div>
        )}
      </div>
    </div>
  );
};
