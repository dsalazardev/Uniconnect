import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroupInvitations } from '@/src/features/groups/hooks';
import { GroupInvitationCard } from '@/src/features/groups/components';
import { ConnectionRequestCard } from '@/src/features/connections/components/ConnectionRequestCard';
import { useConnections } from '@/src/features/connections/hooks/useConnections';

/**
 * EJEMPLO DE IMPLEMENTACIÓN: Pantalla de Vínculos con Pestañas
 * 
 * Esta es una pantalla de referencia que muestra cómo integrar:
 * - Pestaña "Solicitudes": solicitudes de conexión (amigos/contactos)
 * - Pestaña "Invitaciones": invitaciones a grupos de estudio
 * 
 * USO:
 * Reemplazar o adaptar en app/(tabs)/connections.tsx
 */

type TabType = 'solicitudes' | 'invitaciones';

export default function ConnectionsScreenWithTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('solicitudes');
  
  // Obtener usuario y token de tu sistema de auth
  // const { user, token } = useAuth(); // Implementar según tu auth
  const userId = 1; // Placeholder - reemplazar con user.id_user
  const token = 'your-jwt-token'; // Placeholder - reemplazar con token real
  
  // Hook para invitaciones a grupos
  const {
    pendingInvitations,
    loading: loadingInvitations,
    error: errorInvitations,
    respondToInvitation,
    reloadInvitations,
  } = useGroupInvitations(userId, token);
  
  // Hook para solicitudes de conexión (el que ya existe)
  const {
    pendingRequests,
    isLoading: loadingConnections,
    refetch: refetchConnections,
  } = useConnections(); // Usar tu hook existente

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await respondToInvitation(invitationId, 'accepted');
      Alert.alert('¡Éxito!', 'Te has unido al grupo correctamente');
      reloadInvitations();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo aceptar la invitación';
      Alert.alert('Error', errorMessage);
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
              reloadInvitations();
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'No se pudo rechazar la invitación';
              Alert.alert('Error', errorMessage);
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
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      );
    }

    if (pendingRequests.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No tienes solicitudes</Text>
          <Text style={styles.emptyText}>
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
            onUpdated={refetchConnections}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={loadingConnections}
        onRefresh={refetchConnections}
      />
    );
  };

  const renderInvitacionesTab = () => {
    if (loadingInvitations) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando invitaciones...</Text>
        </View>
      );
    }

    if (errorInvitations) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
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
          <Ionicons name="mail-outline" size={80} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No tienes invitaciones</Text>
          <Text style={styles.emptyText}>
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
        refreshing={loadingInvitations}
        onRefresh={reloadInvitations}
      />
    );
  };

  const totalPending = pendingRequests.length + pendingInvitations.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vínculos</Text>
        {totalPending > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalPending} pendientes</Text>
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
            color={activeTab === 'solicitudes' ? '#3B82F6' : '#9CA3AF'}
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
            color={activeTab === 'invitaciones' ? '#3B82F6' : '#9CA3AF'}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContent: {
    paddingVertical: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
