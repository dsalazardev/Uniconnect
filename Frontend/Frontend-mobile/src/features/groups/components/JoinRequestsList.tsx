import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useGroupJoinRequests,
  useAcceptJoinRequest,
  useRejectJoinRequest,
} from '../hooks/usePendingJoinRequests';
import { GroupJoinRequest } from '../types';
import { ConfirmModal } from '@/src/components/ConfirmModal';

interface JoinRequestsListProps {
  groupId: number;
  onEmpty?: (isEmpty: boolean) => void;
}

export const JoinRequestsList = ({ groupId, onEmpty }: JoinRequestsListProps) => {
  const { data: requests = [], isLoading, error } = useGroupJoinRequests(groupId);
  const acceptMutation = useAcceptJoinRequest();
  const rejectMutation = useRejectJoinRequest();

  // ID de la solicitud pendiente de confirmación de rechazo
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  React.useEffect(() => {
    if (requests.length === 0 && !isLoading && !error) {
      onEmpty?.(true);
    } else {
      onEmpty?.(false);
    }
  }, [requests, isLoading, error, onEmpty]);

  const handleAccept = async (requestId: number) => {
    await acceptMutation.mutateAsync({ groupId, requestId });
  };

  const doReject = async () => {
    if (!rejectingId) return;
    await rejectMutation.mutateAsync({ groupId, requestId: rejectingId });
    setRejectingId(null);
  };

  const renderRequest = ({ item: request }: { item: GroupJoinRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requesterInfo}>
        {request.requester.picture ? (
          <Image source={{ uri: request.requester.picture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#D9B97E" />
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.requesterName}>{request.requester.full_name}</Text>
          {request.requester.program && (
            <Text style={styles.programName}>{request.requester.program.name}</Text>
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
          onPress={() => setRejectingId(request.id_request)}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
        >
          {rejectMutation.isPending && rejectingId === request.id_request ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="close" size={20} color="#EF4444" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

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

      {!isLoading && !error && requests.length > 0 && (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id_request.toString()}
          renderItem={renderRequest}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modal de confirmación para rechazar */}
      <ConfirmModal
        visible={rejectingId !== null}
        title="Rechazar solicitud"
        message="¿Deseas rechazar esta solicitud de acceso?"
        confirmText="Rechazar"
        destructive
        webFallback
        onConfirm={doReject}
        onCancel={() => setRejectingId(null)}
      />
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
  infoContainer: { flex: 1 },
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
});
