import React from 'react';
import type { Group } from '@uniconnect/shared';
import { GroupCard } from './GroupCard';
import { BookOpen } from 'lucide-react';
import styles from './GroupList.module.css';

export interface GroupListProps {
  groups: Group[] | undefined | null;
  onGroupPress: (groupId: number) => void;
  onEdit: (group: Group) => void;
  onDelete: (groupId: number) => void;
  deletingGroupId?: number | null;
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  onGroupPress,
  onEdit,
  onDelete,
  deletingGroupId,
}) => {
  const safeGroups = Array.isArray(groups) ? groups : [];

  if (safeGroups.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <BookOpen size={48} className={styles.emptyIcon} />
        <p className={styles.emptyText}>No hay grupos disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {safeGroups.map((group) => (
        <GroupCard
          key={group.id_group}
          group={group}
          onPress={() => onGroupPress(group.id_group)}
          onEdit={() => onEdit(group)}
          onDelete={() => onDelete(group.id_group)}
          isDeleting={deletingGroupId === group.id_group}
        />
      ))}
    </div>
  );
};
