import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConnections } from '@/src/features/connections/hooks/useConnections';
import { ConnectionRequestCard } from '@/src/features/connections/components/ConnectionRequestCard';
import { useGroupInvitations } from '@/src/features/groups/hooks/useGroupInvitations';
import { GroupInvitationCard } from '@/src/features/groups/components/GroupInvitationCard';
import { useQueryClient } from '@tanstack/react-query';
import { authStore } from '@/src/features/auth';

type TabType = 'solicitudes' | 'invitaciones';

export default function ConnectionsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('solicitudes');
  const queryClient = useQueryClient();

  // Obtener datos del usuario autenticado
  const userId = authStore.user?.id_user;
  const token = authStore.accessToken || '';

  // Hook para solicitudes de conexión
  const {
    pendingRequests,
    isLoading: loadingConnections,
    isError: errorConnections,
    refetch: refetchConnections,
  } = useConnections();

  // Hook para invitaciones a grupos
  const {
    pendingInvitations,
    loading: loadingInvitations,
    error: errorInvitations,
    respondToInvitation,
    reloadInvitations,
  } = useGroupInvitations(userId, token);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefreshSolicitudes = React.useCallback(async () => {
    setRefreshing(true);
    await refetchConnections();
    setRefreshing(false);
  }, [refetchConnections]);

  const onRefreshInvitaciones = React.useCallback(async () => {
    setRefreshing(true);
    await reloadInvitations();
    setRefreshing(false);
  }, [reloadInvitations]);

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await respondToInvitation(invitationId, 'accepted');
      Alert.alert('¡Éxito!', 'Te has unido al grupo correctamente');
      queryClient.invalidateQueries({ queryKey: ['pending-group-invitations', userId] });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo aceptar la invitación');
    }
  };

  const handleRejectInvitation = async (invitationId: number) => {
    Alert.alert(
      'Rechazar invitación',
      '¿Estás seguro de que deseas rechazar esta invitación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await respondToInvitation(invitationId, 'rejected');
              Alert.alert('Invitación rechazada');
              queryClient.invalidateQueries({ queryKey: ['pending-group-invitations', userId] });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo rechazar la invitación');
            }
          },
        },
      ]
    );
  };

  const renderSolicitudesTab = () => {
    if (loadingConnections) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D9B97E" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      );
    }

    if (errorConnections) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff4d4d" />
          <Text style={styles.errorText}>Error al cargar solicitudes</Text>
        </View>
      );
    }

    if (pendingRequests.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#888" />
          <Text style={styles.emptyText}>No hay solicitudes</Text>
          <Text style={styles.emptySubtext}>
            Las solicitudes de conexión aparecerán aquí
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id_connection.toString()}
        renderItem={({ item }) => (
          <ConnectionRequestCard
            request={item}
            onUpdated={() => queryClient.invalidateQueries({ queryKey: ['pending-connections'] })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshSolicitudes}
            tintColor="#D9B97E"
            colors={['#D9B97E']}
          />
        }
      />
    );
  };

  const renderInvitacionesTab = () => {
    if (loadingInvitations) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D9B97E" />
          <Text style={styles.loadingText}>Cargando invitaciones...</Text>
        </View>
      );
    }

    if (errorInvitations) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff4d4d" />
          <Text style={styles.errorText}>{errorInvitations}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={reloadInvitations}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (pendingInvitations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-outline" size={80} color="#888" />
          <Text style={styles.emptyText}>No hay invitaciones</Text>
          <Text style={styles.emptySubtext}>
            Las invitaciones a grupos aparecerán aquí
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={pendingInvitations}
        keyExtractor={(item) => item.id_invitation.toString()}
        renderItem={({ item }) => (
          <GroupInvitationCard
            invitation={item}
            onAccept={() => handleAcceptInvitation(item.id_invitation)}
            onReject={() => handleRejectInvitation(item.id_invitation)}
            loading={loadingInvitations}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshInvitaciones}
            tintColor="#D9B97E"
            colors={['#D9B97E']}
          />
        }
      />
    );
  };

  const totalPending = pendingRequests.length + pendingInvitations.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Vínculos</Text>
          <Text style={styles.subtitle}>
            {totalPending > 0
              ? `${totalPending} ${totalPending === 1 ? 'pendiente' : 'pendientes'}`
              : 'No hay pendientes'}
          </Text>
        </View>
        {totalPending > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalPending}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'solicitudes' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('solicitudes')}
        >
          <Ionicons
            name="person-add"
            size={20}
            color={activeTab === 'solicitudes' ? '#D9B97E' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'solicitudes' && styles.activeTabText,
            ]}
          >
            Solicitudes
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'invitaciones' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('invitaciones')}
        >
          <Ionicons
            name="mail"
            size={20}
            color={activeTab === 'invitaciones' ? '#D9B97E' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'invitaciones' && styles.activeTabText,
            ]}
          >
            Grupos
          </Text>
          {pendingInvitations.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingInvitations.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'solicitudes' ? renderSolicitudesTab() : renderInvitacionesTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#363636',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#363636',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 185, 126, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  headerBadge: {
    backgroundColor: 'rgba(217, 185, 126, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9B97E',
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D9B97E',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 185, 126, 0.3)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#D9B97E',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#D9B97E',
  },
  badge: {
    backgroundColor: '#D9B97E',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#aaa',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ff4d4d',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#D9B97E',
    borderRadius: 8,
  },
  retryText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#aaa',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
});
