import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { GroupMembership } from '../types';
import { groupAdminStore } from '../store/GroupAdminStore';
import { ConfirmModal } from '@/src/components/ConfirmModal';

interface TransferOwnershipModalProps {
  groupId: number;
  groupName?: string;
  members: GroupMembership[];
  currentOwnerId: number;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TransferOwnershipModal = ({
  groupId,
  members,
  currentOwnerId,
  visible,
  onClose,
  onSuccess,
}: TransferOwnershipModalProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Filtrar miembros: excluir al owner actual
  const eligibleMembers = members.filter(m => m.id_user !== currentOwnerId);

  const handleTransfer = () => {
    if (!selectedMemberId) return;
    setShowConfirm(true);
  };

  const doTransfer = async () => {
    if (!selectedMemberId) return;
    setShowConfirm(false);
    try {
      // Usar requestOwnershipTransfer (US-W02): envía solicitud al candidato
      // El candidato debe aceptar antes de que el cambio sea efectivo
      await groupAdminStore.requestOwnershipTransfer(groupId, selectedMemberId, queryClient);
      onSuccess?.();
      onClose();
    } catch {
      // error ya manejado en el store
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transferir Propiedad</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#D9B97E" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={24} color="#D9B97E" />
          <Text style={styles.infoText}>
            Selecciona un miembro para proponerle la administración. Recibirá una notificación y deberá aceptar antes de que el cambio sea efectivo. No podrás salir del grupo hasta que acepte.
          </Text>
        </View>

        {/* Members List */}
        {eligibleMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>
              No hay miembros disponibles para transferir la propiedad
            </Text>
            <Text style={styles.emptySubtext}>
              Debes tener al menos un miembro en el grupo
            </Text>
          </View>
        ) : (
          <FlatList
            data={eligibleMembers}
            keyExtractor={(item) => item.id_user.toString()}
            renderItem={({ item: member }) => (
              <TouchableOpacity
                style={[
                  styles.memberCard,
                  selectedMemberId === member.id_user && styles.memberCardSelected,
                ]}
                onPress={() => setSelectedMemberId(member.id_user)}
              >
                <View style={styles.memberInfo}>
                  {member.user?.picture ? (
                    <Image source={{ uri: member.user.picture }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#D9B97E" />
                    </View>
                  )}

                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.user?.full_name}</Text>
                    {member.user?.email && (
                      <Text style={styles.memberEmail}>{member.user.email}</Text>
                    )}
                    {member.role === 'admin' && (
                      <View style={styles.adminBadge}>
                        <Ionicons name="star" size={12} color="#D9B97E" />
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.radio,
                    selectedMemberId === member.id_user && styles.radioSelected,
                  ]}
                >
                  {selectedMemberId === member.id_user && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Footer Actions */}
        {eligibleMembers.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.transferButton,
                !selectedMemberId && styles.transferButtonDisabled,
              ]}
              onPress={handleTransfer}
              disabled={!selectedMemberId || groupAdminStore.isTransferLoading}
              activeOpacity={0.7}
            >
              {groupAdminStore.isTransferLoading ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : (
                <Text style={styles.transferButtonText}>Proponer administrador</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ConfirmModal
        visible={showConfirm}
        title="Proponer administrador"
        message={`¿Proponer a ${members.find(m => m.id_user === selectedMemberId)?.user?.full_name ?? ''} como nuevo administrador?\n\nRecibirá una notificación. No podrás salir del grupo hasta que acepte.`}
        confirmText="Enviar propuesta"
        onConfirm={doTransfer}
        onCancel={() => setShowConfirm(false)}
      />
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.3)',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#D9B97E',
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  memberCard: {
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
  memberCardSelected: {
    borderColor: '#D9B97E',
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
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
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 185, 126, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D9B97E',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioSelected: {
    borderColor: '#D9B97E',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D9B97E',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#777',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0d0d0d',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 185, 126, 0.1)',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '700',
  },
  transferButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9B97E',
    borderRadius: 8,
    paddingVertical: 12,
  },
  transferButtonDisabled: {
    opacity: 0.5,
  },
  transferButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '700',
  },
});
