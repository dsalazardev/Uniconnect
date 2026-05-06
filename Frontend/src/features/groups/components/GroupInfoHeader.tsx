import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GroupInfo } from '../types';
import { GroupJoinButton } from './GroupJoinButton';

interface GroupInfoHeaderProps {
  groupInfo: GroupInfo;
  onJoinSuccess?: () => void;
}

export const GroupInfoHeader = ({ groupInfo, onJoinSuccess }: GroupInfoHeaderProps) => {
  const createdDate = new Date(groupInfo.created_at).toLocaleDateString();
  
  // Derivar el estado del grupo basado en pending_owner_id
  const groupStatus = groupInfo.pending_owner_id ? 'TransferenciaAdminPendiente' : 'Activo';
  const statusColor = groupInfo.pending_owner_id ? '#F59E0B' : '#22C55E';

  return (
    <View style={styles.container}>
      {/* Header with icon and name */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={32} color="#D9B97E" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.groupName}>{groupInfo.name}</Text>
          <Text style={styles.courseName}>{groupInfo.course.name}</Text>
        </View>
      </View>

      {/* Description */}
      {groupInfo.description && (
        <Text style={styles.description}>{groupInfo.description}</Text>
      )}

      {/* Group info details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Ionicons name="person-outline" size={16} color="#D9B97E" />
          <Text style={styles.detailText}>
            Owner: {groupInfo.owner.full_name}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color="#D9B97E" />
          <Text style={styles.detailText}>
            {groupInfo.memberships.length} miembro{groupInfo.memberships.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#D9B97E" />
          <Text style={styles.detailText}>Creado: {createdDate}</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="ellipse" size={16} color={statusColor} />
          <Text style={[styles.detailText, { color: statusColor }]}>
            {groupStatus}
          </Text>
        </View>
      </View>

      {/* Role badge */}
      {groupInfo.userRole !== 'none' && (
        <View style={styles.roleContainer}>
          <View
            style={[
              styles.roleBadge,
              groupInfo.isOwner && styles.roleBadgeOwner,
              groupInfo.userRole === 'admin' && styles.roleBadgeAdmin,
              groupInfo.userRole === 'member' && styles.roleBadgeMember,
            ]}
          >
            <Ionicons
              name={groupInfo.isOwner ? 'shield' : groupInfo.userRole === 'admin' ? 'star' : 'radio-button-on'}
              size={14}
              color="#fff"
            />
            <Text style={styles.roleBadgeText}>
              {groupInfo.isOwner ? 'Owner' : groupInfo.userRole === 'admin' ? 'Admin' : 'Miembro'}
            </Text>
          </View>
        </View>
      )}

      {/* Join button if not a member */}
      {!groupInfo.isMember && groupInfo.userRole === 'none' && (
        <GroupJoinButton
          groupId={groupInfo.id_group}
          groupInfo={groupInfo}
          onSuccess={onJoinSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 185, 126, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    color: '#D9B97E',
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 12,
    lineHeight: 18,
  },
  detailsContainer: {
    backgroundColor: 'rgba(217, 185, 126, 0.05)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailItem_last: {
    marginBottom: 0,
  },
  detailText: {
    fontSize: 12,
    color: '#ccc',
  },
  roleContainer: {
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleBadgeOwner: {
    backgroundColor: 'rgba(217, 185, 126, 0.2)',
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(100, 200, 255, 0.2)',
  },
  roleBadgeMember: {
    backgroundColor: 'rgba(100, 255, 150, 0.2)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
});
