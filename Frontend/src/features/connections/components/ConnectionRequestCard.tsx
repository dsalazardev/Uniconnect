import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConnectionRequest } from '../types';
import { authService } from '@/src/features/auth/services/auth.service';
import { useRouter } from 'expo-router';
import { connectionService } from '../services/connections.service';

interface ConnectionRequestCardProps {
  request: ConnectionRequest;
  onUpdated?: () => void; // Llamado después de aceptar/rechazar
}

export const ConnectionRequestCard = ({ request, onUpdated }: ConnectionRequestCardProps) => {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  };

  const handleViewProfile = () => {
    router.push(`/(tabs)/student-profile?id=${request.requester.id_user}`);
  };

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      await connectionService.acceptConnectionRequest(request.id_connection);
      Alert.alert('¡Solicitud aceptada!', `${request.requester.full_name} ahora es tu conexión.`);
      onUpdated?.();
    } catch (error: any) {
      console.log(error);
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo aceptar la solicitud.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      await connectionService.rejectConnectionRequest(request.id_connection);
      Alert.alert('Solicitud rechazada', `Has rechazado la solicitud de ${request.requester.full_name}.`);
      onUpdated?.();
    } catch (error: any) {
      console.log(error);
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo rechazar la solicitud.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Avatar y Info */}
      <TouchableOpacity style={styles.leftSection} onPress={handleViewProfile}>
        {request.requester.picture ? (
          <Image
            source={{ uri: authService.getImageUri(request.requester.picture) }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={30} color="#666" />
          </View>
        )}
      </TouchableOpacity>

      {/* Contenido */}
      <View style={styles.content}>
        <TouchableOpacity onPress={handleViewProfile}>
          <Text style={styles.name}>{request.requester.full_name}</Text>
        </TouchableOpacity>
        <Text style={styles.program} numberOfLines={1}>
          {request.requester.program?.name}
        </Text>
        <Text style={styles.time}>{formatTime(request.request_at)}</Text>

        {/* Botones de acción */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={isAccepting || isRejecting}
            activeOpacity={0.7}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.acceptText}>Aceptar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={isAccepting || isRejecting}
            activeOpacity={0.7}
          >
            {isRejecting ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <>
                <Ionicons name="close" size={18} color="#666" />
                <Text style={styles.rejectText}>Rechazar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
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
  actions: {
    flexDirection: 'row',
    gap: 8,
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