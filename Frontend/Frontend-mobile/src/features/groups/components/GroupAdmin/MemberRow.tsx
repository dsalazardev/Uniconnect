import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { groupAdminStore } from '../../store/GroupAdminStore';
import { groupsService } from '../../services';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { GroupMembership } from '../../types';
import { adminStyles as s } from './styles';
import { useDirectMessage } from '../../hooks/useDirectMessage';

interface MemberRowProps {
  member: GroupMembership;
  groupId: number;
  /** ID del owner actual del grupo */
  ownerId: number;
  /** El usuario autenticado puede gestionar miembros (es owner) */
  canManage: boolean;
}

export const MemberRow = observer(
  ({ member, groupId, ownerId, canManage }: MemberRowProps) => {
    const queryClient = useQueryClient();
    const token = authStore.accessToken ?? '';
    const currentUserId = authStore.user?.id_user;
    const { openDirectMessage, loadingUserId } = useDirectMessage();
    const isDmLoading = loadingUserId === member.id_user;

    const isOwner = member.id_user === ownerId;
    const isAdmin = member.role === 'admin';
    const memberName = member.user?.full_name ?? 'este miembro';

    // ¿Este miembro es el candidato con transferencia pendiente?
    const isPendingCandidate =
      groupAdminStore.pendingTransferCandidateId === member.id_user;

    // El usuario autenticado es el owner del grupo
    const currentUserIsOwner = currentUserId === ownerId;

    // ── Handlers de gestión ──────────────────────────────────────────────────

    const handleRemove = () => {
      Alert.alert('Sacar miembro', `¿Sacar a ${memberName} del grupo?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sacar',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsService.removeMemberFromGroup(groupId, member.id_user);
              await groupAdminStore.fetchMembers(groupId);
              queryClient.invalidateQueries({ queryKey: ['group-info', groupId] });
            } catch (err: unknown) {
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'No se pudo sacar al miembro.',
              );
            }
          },
        },
      ]);
    };

    const handleMakeAdmin = () => {
      Alert.alert('Hacer administrador', `¿Convertir a ${memberName} en admin?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await groupsService.makeMemberAdmin(groupId, member.id_user);
              await groupAdminStore.fetchMembers(groupId);
              queryClient.invalidateQueries({ queryKey: ['group-info', groupId] });
            } catch (err: unknown) {
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'No se pudo promover al miembro.',
              );
            }
          },
        },
      ]);
    };

    // ── Handlers de transferencia ────────────────────────────────────────────

    const handleRequestTransfer = () => {
      // Bloquear si ya hay una transferencia pendiente hacia otro miembro
      if (
        groupAdminStore.pendingTransferCandidateId !== null &&
        groupAdminStore.pendingTransferCandidateId !== member.id_user
      ) {
        Alert.alert(
          'Transferencia en curso',
          'Ya hay una transferencia pendiente hacia otro miembro. Cancélala antes de iniciar una nueva.',
        );
        return;
      }

      Alert.alert(
        'Transferir administración',
        `¿Transferir la propiedad del grupo a ${memberName}?\n\nEsta persona recibirá una notificación y deberá aceptar antes de que el cambio sea efectivo.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Solicitar transferencia',
            onPress: () =>
              groupAdminStore.requestOwnershipTransfer(groupId, member.id_user),
          },
        ],
      );
    };

    const handleCancelTransfer = () => {
      Alert.alert(
        'Cancelar transferencia',
        `¿Cancelar la solicitud de transferencia enviada a ${memberName}?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: () => groupAdminStore.cancelOwnershipTransfer(groupId),
          },
        ],
      );
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
      <View style={s.memberCard}>
        {/* Columna izquierda: avatar + info */}
        <View style={s.rowLeft}>
          {member.user?.picture ? (
            <Image source={{ uri: member.user.picture }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]}>
              <Ionicons name="person" size={22} color="#D9B97E" />
            </View>
          )}

          <View style={s.rowInfo}>
            <View style={s.nameRow}>
              <Text style={s.rowName}>{memberName}</Text>
              {isOwner && (
                <View style={s.ownerBadge}>
                  <Text style={s.ownerBadgeText}>Owner</Text>
                </View>
              )}
              {isAdmin && !isOwner && (
                <View style={s.adminBadge}>
                  <Text style={s.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>

            {member.user?.email && (
              <Text style={s.rowEmail}>{member.user.email}</Text>
            )}

            {/* Estado de transferencia pendiente bajo el email */}
            {isPendingCandidate && (
              <View style={s.transferPendingRow}>
                <Ionicons name="time-outline" size={12} color="#A78BFA" />
                <Text style={s.transferPendingText}>Esperando respuesta...</Text>
                <TouchableOpacity
                  style={s.cancelTransferBtn}
                  onPress={handleCancelTransfer}
                  disabled={groupAdminStore.isTransferLoading}
                >
                  {groupAdminStore.isTransferLoading ? (
                    <ActivityIndicator size="small" color="#A78BFA" />
                  ) : (
                    <Text style={s.cancelTransferText}>Cancelar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Columna derecha: botones de acción */}
        <View style={s.rowActions}>
          {/* Botón DM — visible para cualquier miembro que no sea el usuario actual */}
          {member.id_user !== currentUserId && (
            <TouchableOpacity
              style={[s.iconBtn, s.dmBtn]}
              onPress={() => openDirectMessage(member.id_user)}
              disabled={isDmLoading}
              accessibilityLabel="Mensaje privado"
            >
              {isDmLoading ? (
                <ActivityIndicator size="small" color="#38BDF8" />
              ) : (
                <Ionicons name="chatbubble-outline" size={16} color="#38BDF8" />
              )}
            </TouchableOpacity>
          )}

          {/* Acciones de gestión — solo si canManage y no es el owner */}
          {canManage && !isOwner && (
            <>
              {/* Botón "Transferir admin" — solo visible para el owner autenticado */}
              {currentUserIsOwner && !isPendingCandidate && (
                <TouchableOpacity
                  style={[s.iconBtn, s.transferBtn]}
                  onPress={handleRequestTransfer}
                  disabled={groupAdminStore.isTransferLoading}
                  accessibilityLabel="Transferir administración"
                >
                  {groupAdminStore.isTransferLoading ? (
                    <ActivityIndicator size="small" color="#A78BFA" />
                  ) : (
                    <Ionicons name="swap-horizontal-outline" size={16} color="#A78BFA" />
                  )}
                </TouchableOpacity>
              )}

              {/* Promover a admin (solo si aún no lo es) */}
              {!isAdmin && (
                <TouchableOpacity
                  style={[s.iconBtn, s.adminBtn]}
                  onPress={handleMakeAdmin}
                  accessibilityLabel="Hacer administrador"
                >
                  <Ionicons name="shield-outline" size={16} color="#D9B97E" />
                </TouchableOpacity>
              )}

              {/* Sacar del grupo */}
              <TouchableOpacity
                style={[s.iconBtn, s.rejectBtn]}
                onPress={handleRemove}
                accessibilityLabel="Sacar del grupo"
              >
                <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  },
);
