import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroupInfo } from '../hooks/useGroupInfo';
import { GroupInfoHeader } from './GroupInfoHeader';
import { GroupMembersTab } from './GroupMembersTab';
import { InviteToGroupModal } from './InviteToGroupModal';
import { JoinRequestsList } from './JoinRequestsList';
import { TransferInvitationBanner } from './TransferInvitationBanner';
import { PendingTransferOwnerBanner } from './PendingTransferOwnerBanner';

interface GroupInfoModalProps {
  groupId: number;
  visible: boolean;
  onClose: () => void;
  /** Si true (viene de notificación push), hace scroll automático al banner de aceptación */
  scrollToAccept?: boolean;
}

export const GroupInfoModal = ({ groupId, visible, onClose, scrollToAccept = false }: GroupInfoModalProps) => {
  const { data: groupInfo, isLoading, error } = useGroupInfo(groupId);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const bannerYRef = useRef<number>(0);

  // Obtener el nombre del candidato desde memberships usando pending_owner_id
  const getCandidateName = () => {
    if (!groupInfo?.pending_owner_id || !groupInfo?.memberships) {
      return undefined;
    }
    const candidate = groupInfo.memberships.find(
      (member) => member.id_user === groupInfo.pending_owner_id
    );
    return candidate?.user?.full_name;
  };

  // Cuando los datos cargan y viene de notificación, hacer scroll al banner
  useEffect(() => {
    if (scrollToAccept && groupInfo && !isLoading && bannerYRef.current > 0) {
      // Pequeño delay para que el layout esté listo
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: bannerYRef.current, animated: true });
      }, 300);
    }
  }, [scrollToAccept, groupInfo, isLoading]);

  // ✅ Modal maneja visible internamente, no necesitamos early return
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
          <Text style={styles.headerTitle}>Información del Grupo</Text>
          <View style={styles.headerActions}>
            {groupInfo?.canManage && (
              <TouchableOpacity
                onPress={() => setShowInviteModal(true)}
                style={styles.inviteButton}
                activeOpacity={0.7}
              >
                <Ionicons name="person-add" size={24} color="#D9B97E" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#D9B97E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#D9B97E" />
            <Text style={styles.loadingText}>Cargando información...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>Error al cargar información</Text>
          </View>
        ) : groupInfo ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <GroupInfoHeader groupInfo={groupInfo} onJoinSuccess={onClose} />

            {/* Banner de propuesta de administración — visible solo para el candidato */}
            <View
              onLayout={(e) => {
                bannerYRef.current = e.nativeEvent.layout.y;
              }}
            >
              <TransferInvitationBanner
                groupId={groupId}
                groupName={groupInfo.name}
                pendingOwnerId={groupInfo.pending_owner_id}
                ownerName={groupInfo.owner?.full_name}
              />
            </View>

            {/* Banner de transferencia pendiente — visible solo para el owner saliente */}
            {groupInfo.isOwner && groupInfo.pending_owner_id && (
              <PendingTransferOwnerBanner candidateName={getCandidateName()} />
            )}

            {/* Solicitudes de unión – solo visible para el owner */}
            {groupInfo.isOwner && (
              <View style={styles.requestsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people-circle-outline" size={20} color="#F97316" />
                  <Text style={[styles.sectionTitle, { color: '#F97316' }]}>Solicitudes de unión</Text>
                </View>
                <JoinRequestsList
                  groupId={groupId}
                  onEmpty={(isEmpty: boolean) => {
                    // Si queremos ocultarlo dinámicamente, podríamos usar un estado aquí.
                    // Pero para hacerlo simple, delegamos al JoinRequestsList que retorne null si está vacío,
                    // y el encabezado lo ocultamos si no hay data.
                  }}
                />
              </View>
            )}

            <View style={styles.membersSection}>
              <Text style={styles.sectionTitle}>Miembros del Grupo</Text>
              <GroupMembersTab groupInfo={groupInfo} onClose={onClose} />
            </View>
          </ScrollView>
        ) : null}
      </View>

      <InviteToGroupModal
        groupId={groupId}
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  membersSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  requestsSection: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249, 115, 22, 0.15)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 12,
  },
});