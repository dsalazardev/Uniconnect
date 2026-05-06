import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GroupMembership } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services';
import { useGroupInfo } from '../hooks/useGroupInfo';
import { useConnections } from '@/src/features/connections/hooks/useConnections';
import { authStore } from '@/src/features/auth/store/AuthStore';

interface InviteToGroupModalProps {
  groupId: number;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface User {
  id_user: number;
  full_name: string;
  picture?: string;
  email?: string;
  program?: {
    name: string;
  };
  common_courses?: Array<{
    id_course: number;
    name: string;
  }>;
}

const isUserArray = (value: unknown): value is User[] => Array.isArray(value);

const isDataWrapper = (value: unknown): value is { data?: unknown } =>
  typeof value === 'object' && value !== null && 'data' in value;

export const InviteToGroupModal = ({
  groupId,
  visible,
  onClose,
  onSuccess,
}: InviteToGroupModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const insets = useSafeAreaInsets();
  const userId = authStore.user?.id_user || 0;
  const queryClient = useQueryClient();

  // Obtener información del grupo para conocer la materia
  const { data: groupInfo, isLoading: groupLoading } = useGroupInfo(groupId);

  // Obtener conexiones del usuario
  const { myConnections = [] } = useConnections();

  const { data: invitables = [], isLoading: loadingInvitables } = useQuery<User[]>({
    queryKey: ['connections-with-course', groupId],
    queryFn: async () => {
      const response = await groupsService.getConnectionsWithCourse(groupId);
      if (isUserArray(response)) {
        return response;
      }
      if (isDataWrapper(response) && isUserArray(response.data)) {
        return response.data;
      }
      return [];
    },
    enabled: !!groupId,
  });

  // Obtener solicitudes de unión pendientes para deshabilitar esos usuarios
  const { data: joinRequests = [] } = useQuery<Array<{ id_user: number }>>({
    queryKey: ['group-join-requests', groupId],
    queryFn: () => groupsService.getGroupJoinRequests(groupId),
    enabled: !!groupId,
  });
  const pendingRequesterIds = React.useMemo(
    () => new Set(joinRequests.map((r) => r.id_user)),
    [joinRequests]
  );

  // Filtrar conexiones que compartan la misma materia del grupo y no sean miembros aún
  const filteredUsers = React.useMemo(() => {
    if (!invitables) return [];

    // Obtener los IDs de los miembros actuales para no listarlos
    const currentMemberIds = groupInfo?.memberships?.map((m: GroupMembership) => m.id_user) || [];

    // Filtramos primero a los que no son miembros
    let filtered = invitables.filter((user: User) => !currentMemberIds.includes(user.id_user));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user: User) =>
          user.full_name.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.program?.name.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [invitables, searchQuery, groupInfo]);

  const sendInvitationMutation = useMutation({
    mutationFn: async (inviteeId: number) => {
      return groupsService.sendInvitation({
        id_group: groupId,
        inviter_id: userId,
        invitee_id: inviteeId,
      });
    },
    onSuccess: () => {
      // Invalidar las invitaciones pendientes de todos los usuarios
      queryClient.invalidateQueries({ queryKey: ['pending-group-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['sent-group-invitations'] });
    },
  });

  const handleToggleUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSendInvitations = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un usuario');
      return;
    }

    try {
      const count = selectedUsers.length;
      let successCount = 0;
      let errorCount = 0;
      let lastError = '';

      for (const inviteeId of selectedUsers) {
        try {
          await sendInvitationMutation.mutateAsync(inviteeId);
          successCount++;
        } catch (err: any) {
          errorCount++;
          lastError = err?.response?.data?.message || err?.message || 'Error desconocido';
          console.error('Error invitando usuario:', err);
        }
      }

      setSelectedUsers([]);
      setSearchQuery('');

      // Mostrar resultado final
      if (successCount > 0 && errorCount === 0) {
        Alert.alert('Éxito', `${successCount} invitación(es) enviada(s) correctamente`);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 300);
      } else if (successCount > 0 && errorCount > 0) {
        Alert.alert(
          'Parcialmente completado',
          `${successCount} invitación(es) enviada(s) correctamente.\n${errorCount} fallaron.`
        );
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 300);
      } else {
        Alert.alert('Error', lastError || 'No se pudo enviar ninguna invitación');
      }
    } catch (error) {
      console.error('Error en handleSendInvitations:', error);
      Alert.alert('Error', 'Hubo un error al enviar las invitaciones');
    }
  };

  // ✅ Modal maneja visible internamente, no necesitamos early return
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Invitar a Grupo</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#D9B97E" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o programa..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Users List */}
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id_user.toString()}
          renderItem={({ item: user }) => {
            const hasPendingRequest = pendingRequesterIds.has(user.id_user);
            return (
              <TouchableOpacity
                style={[
                  styles.userCard,
                  selectedUsers.includes(user.id_user) && styles.userCardSelected,
                  hasPendingRequest && styles.userCardDisabled,
                ]}
                onPress={() => !hasPendingRequest && handleToggleUser(user.id_user)}
                disabled={hasPendingRequest}
              >
                <View style={styles.userInfo}>
                  {user.picture ? (
                    <Image source={{ uri: user.picture }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#D9B97E" />
                    </View>
                  )}

                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    {user.program && (
                      <Text style={styles.program}>{user.program.name}</Text>
                    )}
                    {user.email && <Text style={styles.email}>{user.email}</Text>}
                    {hasPendingRequest && (
                      <Text style={styles.pendingRequestLabel}>Solicitud de unión pendiente</Text>
                    )}
                  </View>
                </View>

                {hasPendingRequest ? (
                  <Ionicons name="time-outline" size={20} color="#666" />
                ) : (
                  <View
                    style={[
                      styles.checkbox,
                      selectedUsers.includes(user.id_user) && styles.checkboxSelected,
                    ]}
                  >
                    {selectedUsers.includes(user.id_user) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>
                No hay conexiones disponibles para invitar
              </Text>
              <Text style={styles.emptySubtext}>
                Conéctate con otros estudiantes para poder invitarlos a grupos
              </Text>
            </View>
          }
        />

        {/* Footer Actions */}
        {selectedUsers.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.selectedCount}>
              {selectedUsers.length} usuario{selectedUsers.length !== 1 ? 's' : ''} seleccionado
              {selectedUsers.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendInvitations}
              disabled={sendInvitationMutation.isPending}
              activeOpacity={0.7}
            >
              {sendInvitationMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Enviar Invitación</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0d0d0d',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 185, 126, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(217, 185, 126, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
  },
  userCardSelected: {
    borderColor: '#D9B97E',
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
  },
  userCardDisabled: {
    opacity: 0.5,
  },
  pendingRequestLabel: {
    fontSize: 11,
    color: '#F97316',
    marginTop: 2,
  },
  userInfo: {
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  program: {
    fontSize: 12,
    color: '#D9B97E',
    marginBottom: 2,
  },
  email: {
    fontSize: 11,
    color: '#999',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#D9B97E',
    borderColor: '#D9B97E',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#777',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0d0d0d',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 185, 126, 0.1)',
  },
  selectedCount: {
    fontSize: 12,
    color: '#D9B97E',
    marginBottom: 8,
    fontWeight: '500',
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9B97E',
    borderRadius: 8,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '700',
  },
});
