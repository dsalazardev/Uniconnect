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
import { useRouter } from 'expo-router';
import { useMyGroups, useDiscoverGroups } from '@/src/features/groups/hooks';
import { GroupCard } from '@/src/features/groups/components/GroupCard';
import { groupsService } from '@/src/features/groups/services/groups.service';

/**
 * EJEMPLO DE IMPLEMENTACIÓN: Pantalla de Grupos con Pestañas
 * 
 * Esta es una pantalla de referencia que muestra cómo integrar:
 * - Pestaña "Mis Grupos": grupos donde soy miembro
 * - Pestaña "Descubrir": grupos disponibles según mis materias
 * 
 * USO:
 * Reemplazar o adaptar en app/(tabs)/groups.tsx
 */

type TabType = 'mis-grupos' | 'descubrir';

export default function GroupsScreenWithTabs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('mis-grupos');
  
  // Obtener usuario y token de tu sistema de auth
  // const { user, token } = useAuth(); // Implementar según tu auth
  const userId = 1; // Placeholder - reemplazar con user.id_user
  const token = 'your-jwt-token'; // Placeholder - reemplazar con token real
  
  // Hook para "Mis Grupos"
  const {
    myGroups,
    loading: loadingMyGroups,
    error: errorMyGroups,
    reloadMyGroups,
  } = useMyGroups(userId, token);
  
  // Hook para "Descubrir Grupos"
  const {
    groups: discoverGroups,
    loading: loadingDiscover,
    error: errorDiscover,
    reloadDiscoverGroups,
  } = useDiscoverGroups(userId, token);

  const handleGroupPress = (groupId: number) => {
    // Navegar al detalle del grupo o al chat
    router.push(`/groups/${groupId}`);
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      // Implementar lógica de unirse al grupo
      // Puede ser una invitación automática o solicitud
      Alert.alert('Éxito', '¡Te has unido al grupo!');
      reloadMyGroups();
      reloadDiscoverGroups();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo unir al grupo';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsService.deleteGroup(groupId, token);
              Alert.alert('Éxito', 'Grupo eliminado correctamente');
              reloadMyGroups();
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar el grupo';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const renderMyGroupsTab = () => {
    if (loadingMyGroups) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando mis grupos...</Text>
        </View>
      );
    }

    if (errorMyGroups) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{errorMyGroups}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={reloadMyGroups}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (myGroups.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No tienes grupos</Text>
          <Text style={styles.emptyText}>
            Crea un grupo o únete a uno existente
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={myGroups}
        keyExtractor={(item) => item.id_group.toString()}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() => handleGroupPress(item.id_group)}
            onEdit={() => }
            onDelete={() => handleDeleteGroup(item.id_group)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={loadingMyGroups}
        onRefresh={reloadMyGroups}
      />
    );
  };

  const renderDiscoverTab = () => {
    if (loadingDiscover) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Buscando grupos...</Text>
        </View>
      );
    }

    if (errorDiscover) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{errorDiscover}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={reloadDiscoverGroups}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (discoverGroups.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={80} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No hay grupos disponibles</Text>
          <Text style={styles.emptyText}>
            No encontramos grupos de tus materias inscritas
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={discoverGroups}
        keyExtractor={(item) => item.id_group.toString()}
        renderItem={({ item }) => (
          <View style={styles.discoverCard}>
            <GroupCard
              group={item}
              onPress={() => handleGroupPress(item.id_group)}
              onEdit={() => {}}
              onDelete={() => {}}
            />
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleJoinGroup(item.id_group)}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.joinButtonText}>Solicitar unirme</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshing={loadingDiscover}
        onRefresh={reloadDiscoverGroups}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Grupos de Estudio</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            // Navegar a crear grupo
            Alert.alert('Info', 'Implementar modal de crear grupo');
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'mis-grupos' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('mis-grupos')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'mis-grupos' ? '#3B82F6' : '#9CA3AF'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'mis-grupos' && styles.activeTabText,
            ]}
          >
            Mis Grupos
          </Text>
          {myGroups.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{myGroups.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'descubrir' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('descubrir')}
        >
          <Ionicons
            name="compass"
            size={20}
            color={activeTab === 'descubrir' ? '#3B82F6' : '#9CA3AF'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'descubrir' && styles.activeTabText,
            ]}
          >
            Descubrir
          </Text>
          {discoverGroups.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{discoverGroups.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'mis-grupos' ? renderMyGroupsTab() : renderDiscoverTab()}
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
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#3B82F6',
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
    paddingVertical: 16,
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
  discoverCard: {
    marginBottom: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 12,
    borderRadius: 8,
    gap: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
