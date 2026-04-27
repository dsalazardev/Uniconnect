import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GroupInvitation, GroupJoinRequest } from '../types';
import { groupsService } from '../services/groups.service';
import { authStore } from '@/src/features/auth/store/AuthStore';

interface GroupInvitationCardProps {
  invitation: GroupInvitation | GroupJoinRequest;
  onAccept?: () => void;
  onReject?: () => void;
  loading?: boolean;
}

export const GroupInvitationCard: React.FC<GroupInvitationCardProps> = ({
  invitation,
  onAccept,
  onReject,
  loading = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const token = authStore.accessToken || '';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  const handleAccept = async () => {
    if (!invitation.group?.id_group) return;
    setIsLoading(true);
    try {
      if (invitation.id_invitation) {
        // Es invitación
        await groupsService.acceptGroupInvitation(
          invitation.group.id_group,
          invitation.id_invitation,
          token
        );
        Alert.alert('¡Listo!', 'Te has unido al grupo.');
      } else if (invitation.id_request) {
        // Es solicitud de join
        await groupsService.acceptJoinRequest(
          invitation.group.id_group,
          invitation.id_request,
          token
        );
        Alert.alert('¡Listo!', 'Solicitud aceptada.');
      }
      onAccept?.();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'No se pudo aceptar.'
        : 'No se pudo aceptar.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!invitation.group?.id_group) return;
    setIsLoading(true);
    try {
      if (invitation.id_invitation) {
        // Es invitación
        await groupsService.rejectGroupInvitation(
          invitation.group.id_group,
          invitation.id_invitation,
          token
        );
        Alert.alert('Invitación rechazada', 'Has rechazado la invitación al grupo.');
      } else if (invitation.id_request) {
        // Es solicitud de join
        await groupsService.rejectJoinRequest(
          invitation.group.id_group,
          invitation.id_request,
          token
        );
        Alert.alert('Solicitud rechazada', 'Has rechazado la solicitud.');
      }
      onReject?.();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'No se pudo rechazar.'
        : 'No se pudo rechazar.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Avatar a la izquierda */}
      <View style={styles.leftSection}>
        {invitation.inviter?.picture ? (
          <Image
            source={{ uri: invitation.inviter.picture }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={30} color="#666" />
          </View>
        )}
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        <Text style={styles.name}>
          {invitation.inviter?.full_name || invitation.requester?.full_name || 'Usuario'}
        </Text>
        <Text style={styles.program}>
          {invitation.group?.course?.name || ''}
        </Text>
        <Text style={styles.groupName}>
          {invitation.group?.name}
        </Text>
        {invitation.group?.description ? (
          <Text style={styles.groupDescription} numberOfLines={2}>
            {invitation.group.description}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={loading || isLoading}
          >
            {isLoading && loading ? (
              <ActivityIndicator size="small" color="#aaa" />
            ) : (
              <>
                <Ionicons name="close" size={18} color="#666" />
                <Text style={styles.rejectText}>Rechazar</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={loading || isLoading}
          >
            {isLoading && loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.acceptText}>Aceptar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
    alignItems: 'center',
  },
  leftSection: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    backgroundColor: '#4a4a4a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  program: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: '#888',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D9B97E',
    marginBottom: 2,
  },
  courseName: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#D9B97E',
  },
  acceptText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rejectText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
});