import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useRemoveMember,
  useMakeMemberAdmin,
  useLeaveGroup,
} from '../hooks/useGroupInfo';
import { GroupInfo } from '../types';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { useDirectMessage } from '../hooks/useDirectMessage';
import { authStore } from '@/src/features/auth/store/AuthStore';

interface GroupMembersTabProps {
  groupInfo: GroupInfo;
}

export const GroupMembersTab = ({ groupInfo }: GroupMembersTabProps) => {
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const removeMemberMutation = useRemoveMember();
  const makeAdminMutation = useMakeMemberAdmin();
  const leaveGroupMutation = useLeaveGroup();
  const { openDirectMessage, loadingUserId } = useDirectMessage();
  const currentUserId = authStore.user?.id_user;

  const handleRemoveMember = (memberId: number, memberName: string) => {
    Alert.alert(
      'Sacar miembro',
      `¿Estás seguro de que deseas sacar a ${memberName} del grupo?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Sacar',
          onPress: async () => {
            try {
              await removeMemberMutation.mutateAsync({
                groupId: groupInfo.id_group,
                memberId,
              });
              Alert.alert('Éxito', 'Miembro sacado del grupo');
            } catch (error: unknown) {
              Alert.alert('Error', 'No se pudo sacar el miembro');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleMakeAdmin = (memberId: number, memberName: string) => {
    Alert.alert(
      'Hacer admin',
      `¿Deseas convertir a ${memberName} en administrador?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Hacer admin',
          onPress: async () => {
            try {
              await makeAdminMutation.mutateAsync({
                groupId: groupInfo.id_group,
                memberId,
              });
              Alert.alert('Éxito', 'Miembro promovido a administrador');
            } catch (error: unknown) {
              Alert.alert('Error', 'No se pudo promocionar al miembro');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    if (groupInfo.isOwner) {
      // Abrir modal para transferir propiedad
      setTransferModalVisible(true);
      return;
    }

    Alert.alert(
      'Abandonar grupo',
      '¿Estás seguro de que deseas abandonar este grupo?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Abandonar',
          onPress: async () => {
            try {
              await leaveGroupMutation.mutateAsync(groupInfo.id_group);
              Alert.alert('Éxito', 'Has abandonado el grupo');
            } catch (error: unknown) {
              Alert.alert('Error', 'No se pudo abandonar el grupo');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const showActions = groupInfo.canManageMembers || groupInfo.isMember;

  return (
    <View style={styles.container}>
      {!groupInfo.isMember && groupInfo.userRole === 'none' ? (
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>
            Solo los miembros pueden ver la lista completa
          </Text>
        </View>
      ) : groupInfo.memberships.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No hay miembros aún</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={groupInfo.memberships}
            keyExtractor={(item) => item.id_membership.toString()}
            scrollEnabled={false}
            renderItem={({ item: member }) => (
              <View style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  {member.user?.picture ? (
                    <Image
                      source={{ uri: member.user.picture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#D9B97E" />
                    </View>
                  )}

                  <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                      <Text style={styles.memberName}>
                        {member.user?.full_name || 'Miembro desconocido'}
                      </Text>
                    {member.role === 'admin' && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                      {member.id_user === groupInfo.owner.id_user && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>Owner</Text>
                        </View>
                      )}
                    </View>
                    {member.user?.email && (
                      <Text style={styles.email}>{member.user.email}</Text>
                    )}
                    <Text style={styles.joinedDate}>
                      Unido {new Date(member.joined_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {member.id_user !== currentUserId && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dmButton]}
                    onPress={() => openDirectMessage(member.id_user)}
                    disabled={loadingUserId !== null}
                    accessibilityLabel="Mensaje privado"
                  >
                    {loadingUserId === member.id_user ? (
                      <ActivityIndicator size="small" color="#38BDF8" />
                    ) : (
                      <Ionicons name="chatbubble-outline" size={18} color="#38BDF8" />
                    )}
                  </TouchableOpacity>
                )}

                {groupInfo.canManageMembers && member.role !== 'admin' && member.id_user !== groupInfo.owner.id_user && (
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        handleMakeAdmin(member.id_user, member.user?.full_name || 'Miembro')
                      }
                      disabled={makeAdminMutation.isPending}
                    >
                      {makeAdminMutation.isPending ? (
                        <ActivityIndicator size="small" color="#D9B97E" />
                      ) : (
                        <Ionicons name="shield-outline" size={18} color="#D9B97E" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() =>
                        handleRemoveMember(member.id_user, member.user?.full_name || 'Miembro')
                      }
                      disabled={removeMemberMutation.isPending}
                    >
                      {removeMemberMutation.isPending ? (
                        <ActivityIndicator size="small" color="#ff6b6b" />
                      ) : (
                        <Ionicons name="close-circle-outline" size={18} color="#ff6b6b" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            ListFooterComponent={
              showActions ? (
                <TouchableOpacity
                  style={[
                    styles.leaveButton,
                    groupInfo.isOwner && styles.leaveButtonDisabled,
                  ]}
                  onPress={handleLeaveGroup}
                  disabled={leaveGroupMutation.isPending || (groupInfo.isOwner && showActions)}
                >
                  {leaveGroupMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ff6b6b" />
                  ) : (
                    <Ionicons name="exit-outline" size={18} color="#ff6b6b" />
                  )}
                  <Text style={styles.leaveButtonText}>
                    {groupInfo.isOwner ? 'Transferir propiedad' : 'Abandonar grupo'}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </>
      )}

      {/* Modal de transferir propiedad */}
      <TransferOwnershipModal
        groupId={groupInfo.id_group}
        groupName={groupInfo.name}
        members={groupInfo.memberships || []}
        currentOwnerId={groupInfo.owner.id_user}
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        onSuccess={() => {
          setTransferModalVisible(false);
          // El modal ya invalida las queries necesarias
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  memberCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  adminBadge: {
    backgroundColor: 'rgba(100, 200, 255, 0.3)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64c8ff',
  },
  ownerBadge: {
    backgroundColor: 'rgba(217, 185, 126, 0.3)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D9B97E',
  },
  email: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  joinedDate: {
    fontSize: 10,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  dmButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    gap: 8,
  },
  leaveButtonDisabled: {
    opacity: 0.5,
  },
  leaveButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
});
