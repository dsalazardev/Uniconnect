import React from 'react';
import { Users, User, MessageCircle } from 'lucide-react';
import styles from './MemberList.module.css';

interface Member {
  id_membership: number;
  id_user?: number;
  is_admin?: boolean;
  user?: {
    id_user: number;
    full_name?: string;
    email?: string;
    picture?: string;
  };
}

interface MemberListProps {
  memberships: Member[];
  canManage: boolean;
  ownerId?: number;
  currentUserId?: number;
  loadingUserId?: number | null;
  onDirectMessage?: (userId: number) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  memberships,
  canManage,
  ownerId,
  currentUserId,
  loadingUserId,
  onDirectMessage,
}) => {
  if (memberships.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <Users size={48} className={styles.emptyIcon} />
        <p className={styles.emptyText}>No hay miembros aún</p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {memberships.map((member) => (
        <div key={member.id_membership} className={styles.memberCard}>
          <div className={styles.memberInfo}>
            {member.user?.picture ? (
              <img
                src={member.user.picture}
                alt={member.user.full_name || 'Usuario'}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <User size={40} className={styles.avatarIcon} />
              </div>
            )}

            <div className={styles.infoContainer}>
              <div className={styles.nameRow}>
                <span className={styles.memberName}>
                  {member.user?.full_name || 'Miembro desconocido'}
                </span>
                {member.is_admin && (
                  <span className={styles.adminBadge}>Admin</span>
                )}
                {member.id_user === ownerId && (
                  <span className={styles.ownerBadge}>Owner</span>
                )}
              </div>
              {member.user?.email && (
                <span className={styles.email}>{member.user.email}</span>
              )}
            </div>
            {onDirectMessage && member.id_user && member.id_user !== currentUserId && (
              <button
                className={styles.dmButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDirectMessage(member.id_user!);
                }}
                disabled={loadingUserId === member.id_user}
                title="Enviar mensaje"
              >
                {loadingUserId === member.id_user ? (
                  <span className={styles.dmSpinner} />
                ) : (
                  <MessageCircle size={18} />
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
