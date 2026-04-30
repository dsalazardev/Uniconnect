import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { groupAdminStore } from '../store/GroupAdminStore';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { ConfirmModal } from '@/src/components/ConfirmModal';

interface TransferInvitationBannerProps {
  groupId: number;
  groupName: string;
  pendingOwnerId: number | null | undefined;
  ownerName?: string;
}

/**
 * Banner que aparece SOLO cuando el usuario autenticado es el candidato
 * designado para recibir la administración del grupo (pending_owner_id).
 *
 * Muestra dos acciones:
 *  - Aceptar → llama PATCH /groups/:id/accept-ownership-transfer
 *  - Rechazar → llama DELETE /groups/:id/cancel-ownership-transfer
 */
export const TransferInvitationBanner = observer(
  ({ groupId, groupName, pendingOwnerId, ownerName }: TransferInvitationBannerProps) => {
    const queryClient = useQueryClient();
    const currentUserId = authStore.user?.id_user;
    const [showAcceptConfirm, setShowAcceptConfirm] = React.useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = React.useState(false);

    if (!pendingOwnerId || pendingOwnerId !== currentUserId) return null;

    const doAccept = async () => {
      setShowAcceptConfirm(false);
      const ok = await groupAdminStore.acceptOwnershipTransfer(groupId);
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ['group-info', groupId] });
        queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      }
    };

    const doReject = async () => {
      setShowRejectConfirm(false);
      const ok = await groupAdminStore.rejectOwnershipTransfer(groupId);
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ['group-info', groupId] });
      }
    };

    return (
      <>
        <View style={styles.banner}>
          <View style={styles.iconRow}>
            <Ionicons name="shield-checkmark" size={20} color="#A78BFA" />
            <Text style={styles.title}>Propuesta de administración</Text>
          </View>

          <Text style={styles.body}>
            {ownerName
              ? `${ownerName} te propone como nuevo administrador de este grupo.`
              : 'Te han propuesto como nuevo administrador de este grupo.'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={() => setShowRejectConfirm(true)}
              disabled={groupAdminStore.isDecliningTransfer || groupAdminStore.isAcceptingTransfer}
            >
              {groupAdminStore.isDecliningTransfer ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text style={styles.rejectText}>Rechazar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn]}
              onPress={() => setShowAcceptConfirm(true)}
              disabled={groupAdminStore.isAcceptingTransfer || groupAdminStore.isDecliningTransfer}
            >
              {groupAdminStore.isAcceptingTransfer ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.acceptText}>Aceptar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ConfirmModal
          visible={showAcceptConfirm}
          title="Aceptar administración"
          message={`¿Aceptas convertirte en administrador de "${groupName}"?${ownerName ? `\n\n${ownerName} te ha designado como nuevo propietario.` : ''}`}
          confirmText="Aceptar"
          onConfirm={doAccept}
          onCancel={() => setShowAcceptConfirm(false)}
          webFallback
        />

        <ConfirmModal
          visible={showRejectConfirm}
          title="Rechazar administración"
          message={`¿Rechazas la propuesta de administración de "${groupName}"?`}
          confirmText="Rechazar"
          destructive
          onConfirm={doReject}
          onCancel={() => setShowRejectConfirm(false)}
          webFallback
        />
      </>
    );
  },
);

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    gap: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
  },
  body: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: '#A78BFA',
  },
  acceptText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  rejectText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
