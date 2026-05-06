import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGroups } from "@/src/features/groups/hooks/useGroups";
import { useMyGroups, useDiscoverGroups } from "@/src/features/groups/hooks/useMyGroups";
import { GroupCard } from "@/src/features/groups/components/GroupCard";
import { CreateGroupModal } from "@/src/features/groups/components/CreateGroup";
import { EditGroupModal } from "@/src/features/groups/components/EditGroup";
import { Group } from "@/src/features/groups/types";
import { authStore } from "@/src/features/auth";
import { useJoinRequest } from "@/src/features/groups/hooks/useJoinRequest";

type TabType = "misGrupos" | "descubrir";

export default function GroupsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("misGrupos");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<number>>(new Set());

  // Obtener datos del usuario autenticado
  const userId = authStore.user?.id_user;

  // Hooks para gestión de grupos
  const {
    deleteGroup,
    createGroup,
    updateGroup,
    isUpdating,
    isDeleting,
    isCreating,
  } = useGroups();

  const {
    myGroups,
    loading: loadingMyGroups,
    error: errorMyGroups,
    reloadMyGroups,
  } = useMyGroups(userId);

  const {
    groups: discoverGroups,
    loading: loadingDiscover,
    error: errorDiscover,
    reloadDiscoverGroups: reloadDiscover,
  } = useDiscoverGroups(userId);

  const joinMutation = useJoinRequest();

  const handleGroupPress = (groupId: number) => {
    router.push(`/groups/${groupId}` as any);
  };

  const handleCreateGroup = () => {
    setCreateModalVisible(true);
  };

  const handleSaveNewGroup = async (groupData: any) => {
    await createGroup(groupData);
    setCreateModalVisible(false);
  };

  const handleEdit = (group: Group) => {
    setSelectedGroup(group);
    setEditModalVisible(true);
  };

  const handleUpdateGroup = (groupId: number, groupData: { name: string; description: string; id_course: number }) => {
    updateGroup(
      { id: groupId, data: groupData },
      {
        onSuccess: () => {
          setEditModalVisible(false);
          setSelectedGroup(null);
        },
      },
    );
  };

  const handleDelete = (group: Group) => {
    Alert.alert(
      "Eliminar grupo",
      `¿Estás seguro de que deseas eliminar "${group.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            deleteGroup(group.id_group);
            // React Query invalidará automáticamente las queries
          },
        },
      ]
    );
  };

  const handleJoinGroup = (group: Group) => {
    Alert.alert(
      "Unirse al grupo",
      `Para unirte a "${group.name}", debes recibir una invitación del administrador del grupo.`,
      [{ text: "Entendido" }]
    );
  };

  const handleRequestJoin = async (groupId: number) => {
    try {
      await joinMutation.mutateAsync(groupId);
      setPendingRequests(prev => new Set(prev).add(groupId));
      Alert.alert("Solicitud enviada", "Tu solicitud de unión fue enviada al administrador del grupo.");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "No se pudo enviar la solicitud";

      // Si el backend dice que ya hay solicitud pendiente, actualizamos el estado local de todos modos
      if (errorMessage.toLowerCase().includes('solicitud pendiente')) {
        setPendingRequests(prev => new Set(prev).add(groupId));
      }

      Alert.alert("Error", errorMessage);
    }
  };

  // Calcular cuántos grupos tiene por materia (para mostrar el límite)
  const groupsPerCourse = myGroups.reduce((acc: any, group: Group) => {
    const courseId = group.course?.id_course;
    if (courseId) {
      acc[courseId] = (acc[courseId] || 0) + 1;
    }
    return acc;
  }, {});

  const renderMisGruposTab = () => {
    if (loadingMyGroups) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D9B97E" />
          <Text style={styles.loadingText}>Cargando tus grupos...</Text>
        </View>
      );
    }

    if (errorMyGroups) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff4d4d" />
          <Text style={styles.errorText}>{errorMyGroups}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => reloadMyGroups()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (myGroups.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#888" />
          <Text style={styles.emptyText}>No tienes grupos aún</Text>
          <Text style={styles.emptySubtext}>
            Crea tu primer grupo de estudio para comenzar
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateGroup}
          >
            <Ionicons name="add" size={20} color="#1a1a1a" />
            <Text style={styles.createButtonText}>Crear Grupo</Text>
          </TouchableOpacity>
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
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
            isDeleting={isDeleting}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingMyGroups}
            onRefresh={reloadMyGroups}
            tintColor="#D9B97E"
            colors={["#D9B97E"]}
          />
        }
      />
    );
  };

  const renderDescubrirTab = () => {
    if (loadingDiscover) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D9B97E" />
          <Text style={styles.loadingText}>Cargando grupos disponibles...</Text>
        </View>
      );
    }

    if (errorDiscover) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff4d4d" />
          <Text style={styles.errorText}>{errorDiscover}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => reloadDiscover()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (discoverGroups.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={80} color="#888" />
          <Text style={styles.emptyText}>No hay grupos disponibles</Text>
          <Text style={styles.emptySubtext}>
            Los grupos de tus materias aparecerán aquí
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={discoverGroups}
        keyExtractor={(item) => item.id_group.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.discoverCard}
            onPress={() => handleJoinGroup(item)}
          >
            <View style={styles.discoverCardHeader}>
              <View style={styles.discoverCardIcon}>
                <Ionicons name="people" size={24} color="#D9B97E" />
              </View>
              <View style={styles.discoverCardInfo}>
                <Text style={styles.discoverCardTitle}>{item.name}</Text>
                <Text style={styles.discoverCardCourse}>
                  {item.course?.name || "Sin materia"}
                </Text>
              </View>
            </View>
            {item.description && (
              <Text style={styles.discoverCardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.discoverCardFooter}>
              <View style={styles.discoverCardOwner}>
                <Ionicons name="person" size={14} color="#aaa" />
                <Text style={styles.discoverCardOwnerText}>
                  {item.owner?.full_name || "Propietario"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRequestJoin(item.id_group)}
                disabled={
                  (joinMutation.isPending && joinMutation.variables === item.id_group) ||
                  pendingRequests.has(item.id_group) ||
                  item.user_request_status === 'join_requested' ||
                  item.user_request_status === 'invited'
                }
                style={[
                  styles.joinButton,
                  (pendingRequests.has(item.id_group) || item.user_request_status === 'join_requested') && styles.joinButtonSent,
                  item.user_request_status === 'invited' && styles.joinButtonInvited,
                ]}
                accessibilityLabel="Solicitar unirse al grupo"
              >
                {joinMutation.isPending && joinMutation.variables === item.id_group ? (
                  <ActivityIndicator size={16} color="#D9B97E" />
                ) : item.user_request_status === 'invited' ? (
                  <>
                    <Ionicons name="mail-outline" size={16} color="#aaa" />
                    <Text style={styles.joinButtonTextSent}>Invitación pendiente</Text>
                  </>
                ) : pendingRequests.has(item.id_group) || item.user_request_status === 'join_requested' ? (
                  <>
                    <Ionicons name="checkmark-outline" size={16} color="#aaa" />
                    <Text style={styles.joinButtonTextSent}>Solicitud enviada</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="add-outline" size={16} color="#1a1a1a" />
                    <Text style={styles.joinButtonText}>Solicitar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingDiscover}
            onRefresh={reloadDiscover}
            tintColor="#D9B97E"
            colors={["#D9B97E"]}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Grupos de Estudio</Text>
          <Text style={styles.subtitle}>
            {activeTab === "misGrupos"
              ? `${myGroups.length} ${myGroups.length === 1 ? "grupo" : "grupos"}`
              : `${discoverGroups.length} disponibles`}
          </Text>
        </View>
        {activeTab === "misGrupos" && (
          <TouchableOpacity style={styles.addButton} onPress={handleCreateGroup}>
            <Ionicons name="add" size={28} color="#1a1a1a" />
          </TouchableOpacity>
        )}
      </View>


      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "misGrupos" && styles.activeTab]}
          onPress={() => setActiveTab("misGrupos")}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === "misGrupos" ? "#D9B97E" : "#888"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "misGrupos" && styles.activeTabText,
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
          style={[styles.tab, activeTab === "descubrir" && styles.activeTab]}
          onPress={() => setActiveTab("descubrir")}
        >
          <Ionicons
            name="search"
            size={20}
            color={activeTab === "descubrir" ? "#D9B97E" : "#888"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "descubrir" && styles.activeTabText,
            ]}
          >
            Descubrir
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "misGrupos" ? renderMisGruposTab() : renderDescubrirTab()}

      {/* Modals */}
      <CreateGroupModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleSaveNewGroup}
        isCreating={isCreating}
        groupsPerCourse={groupsPerCourse}
      />

      <EditGroupModal
        visible={editModalVisible}
        group={selectedGroup}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedGroup(null);
        }}
        onSave={handleUpdateGroup}
        isLoading={isUpdating}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#363636",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#363636",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 185, 126, 0.3)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#D9B97E",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 185, 126, 0.3)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#D9B97E",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888",
  },
  activeTabText: {
    color: "#D9B97E",
  },
  badge: {
    backgroundColor: "#D9B97E",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  listContent: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#aaa",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#ff4d4d",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#D9B97E",
    borderRadius: 8,
  },
  retryText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#aaa",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D9B97E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
  discoverCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 185, 126, 0.2)",
  },
  discoverCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  discoverCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(217, 185, 126, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  discoverCardInfo: {
    flex: 1,
  },
  discoverCardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  discoverCardCourse: {
    fontSize: 14,
    color: "#D9B97E",
  },
  discoverCardDescription: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 12,
    lineHeight: 20,
  },
  discoverCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(217, 185, 126, 0.1)",
  },
  discoverCardOwner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discoverCardOwnerText: {
    fontSize: 13,
    color: "#aaa",
  },
  discoverCardAction: {
    fontSize: 14,
    color: "#D9B97E",
    fontWeight: "600",
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9B97E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  joinButtonSent: {
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.3)',
  },
  joinButtonInvited: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  joinButtonText: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '600',
  },
  joinButtonTextSent: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
});
