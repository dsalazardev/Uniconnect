import React from 'react';
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
  useGroupJoinRequests,
  useAcceptJoinRequest,
  useRejectJoinRequest,
} from '../hooks/usePendingJoinRequests';
import { GroupJoinRequest } from '../types';

interface JoinRequestsListProps {
  groupId: number;
  onEmpty?: (isEmpty: boolean) => void;
}

export const JoinRequestsList = ({ groupId, onEmpty }: JoinRequestsListProps) => {
  // ✅ TODOS los hooks al inicio del componente
  const { data: requests = [], isLoading, error } = useGroupJoinRequests(groupId);
  const acceptMutation = useAcceptJoinRequest();
  const rejectMutation = useRejectJoinRequest();

  // ✅ useEffect movido al inicio, después de otros hooks
  React.useEffect(() => {
    if (requests && requests.length === 0 && !isLoading && !error) {
      onEmpty?.(true);
    } else {
      onEmpty?.(false);
    }
  }, [requests, isLoading, error, onEmpty]);

  // ✅ Funciones de handlers (no son hooks)
  const handleAccept = async (requestId: number) => {
    try {
      await acceptMutation.mutateAsync({ groupId, requestId });
      Alert.alert('Éxito', 'Solicitud aceptada. El usuario se ha unido al grupo.');
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'No se pudo aceptar la solicitud';
      Alert.alert('Error', errorMessage || 'No se pudo aceptar la solicitud');
    }
  };

  const handleReject = async (requestId: number) => {
    Alert.alert('Rechazar solicitud', '¿Deseas rechazar esta solicitud?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        onPress: async () => {
          try {
            await rejectMutation.mutateAsync({ groupId, requestId });
            Alert.alert('Solicitud rechazada', 'Se ha notificado al usuario.');
          } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'response' in error 
              ? (error.response as { data?: { message?: string } })?.data?.message 
              : 'No se pudo rechazar la solicitud';
            Alert.alert('Error', errorMessage || 'No se pudo rechazar la solicitud');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const renderRequest = ({ item: request }: { item: GroupJoinRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requesterInfo}>
        {request.requester.picture ? (
          <Image
            source={{ uri: request.requester.picture }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#D9B97E" />
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.requesterName}>
            {request.requester.full_name}
          </Text>
          {request.requester.program && (
            <Text style={styles.programName}>
              {request.requester.program.name}
            </Text>
          )}
          <Text style={styles.email}>{request.requester.email}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAccept(request.id_request)}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
        >
          {acceptMutation.isPending ? (
            <ActivityIndicator size="small" color="#22C55E" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#22C55E" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(request.id_request)}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
        >
          {rejectMutation.isPending ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="close" size={20} color="#EF4444" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // ✅ Conditional rendering en JSX - DESPUÉS de todos los hooks
  return (
    <>
      {isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D9B97E" />
        </View>
      )}
      
      {error && (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>Error al cargar solicitudes</Text>
        </View>
      )}
      
      {!isLoading && !error && requests.length === 0 && null}
      
      {!isLoading && !error && requests.length > 0 && (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id_request.toString()}
          renderItem={renderRequest}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  listContent: {
    gap: 8,
  },
  requestCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requesterInfo: {
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
  requesterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  programName: {
    fontSize: 12,
    color: '#D9B97E',
    marginBottom: 2,
  },
  email: {
    fontSize: 11,
    color: '#999',
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
    borderWidth: 1.5,
  },
  acceptButton: {
    backgroundColor: 'transparent',
    borderColor: '#22C55E',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
});