import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { ChatScreen } from '@/src/features/messages/components/ChatScreen';
import { websocketService } from '@/src/features/messages/services/websocket.service';
import { authStore } from '@/src/features/auth';
import { groupsService } from '@/src/features/groups/services/groups.service';
import { Group } from '@/src/features/groups/types';
import { WEBSOCKET_URL } from '@/src/constants/api';
import { GroupInfoModal } from '@/src/features/groups/components/GroupInfoModal';

export default function GroupChatScreen() {
  const { id, autoOpenInfo, autoOpenAccept } = useLocalSearchParams<{
    id: string;
    autoOpenInfo?: string;
    autoOpenAccept?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Si viene de una notificación push con autoOpenInfo=true, abrir el modal directamente
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const userId = authStore.user?.id_user;
  const token = authStore.accessToken || '';

  // Si viene de notificación push, abrir el modal una vez que el grupo haya cargado
  const pendingAutoOpen = autoOpenInfo === 'true';

  // Escuchar expulsión/salida en tiempo real
  useEffect(() => {
    const groupId = parseInt(id as string);

    const handleAccessRevoked = (data: { id_group: number; group_name: string }) => {
      if (data.id_group !== groupId) return;
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      router.replace('/(tabs)/groups');
    };

    websocketService.on('group:access_revoked', handleAccessRevoked);
    return () => {
      websocketService.off('group:access_revoked', handleAccessRevoked);
    };
  }, [id, queryClient, router]);

  useEffect(() => {
    const loadGroupDetail = async () => {
      try {
        setLoading(true);
        const groupId = parseInt(id as string);
        const groupData = await groupsService.getGroupInfo(groupId, token);
        setGroup(groupData as any);
        setError(null);
        // Abrir el modal automáticamente si viene de notificación push
        if (pendingAutoOpen) {
          setShowGroupInfo(true);
        }
      } catch (err: any) {
        console.error('Error loading group:', err);
        setError(err.message || 'Error al cargar el grupo');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      loadGroupDetail();
    }
  }, [id, token]);

  const handleGoBack = () => {
    router.push('/(tabs)/groups');
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#363636" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D9B97E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cargando...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D9B97E" />
          <Text style={styles.loadingText}>Cargando chat...</Text>
        </View>
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#363636" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D9B97E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff4d4d" />
          <Text style={styles.errorText}>{error || 'Grupo no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleGoBack}>
            <Text style={styles.retryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Obtener información de admin (si está disponible)
  const userMembership = group.user_membership;
  const isAdmin = userMembership?.id_role === 1 || userMembership?.role === 'admin' || false;

  // Determinar si es un chat privado
  const isDirectMessage = group.is_direct_message ?? false;

  // Obtener el nombre del otro usuario en chats privados
  const getOtherUserName = (): string => {
    if (!isDirectMessage || !group.memberships) {
      return group.name;
    }

    const otherMember = group.memberships.find(
      (m) => m.id_user !== userId
    );

    return otherMember?.user?.full_name ?? 'Usuario';
  };

  const displayName = isDirectMessage ? getOtherUserName() : group.name;
  const displaySubtitle = isDirectMessage ? 'Chat privado' : 'Grupo de estudio';
  // HOTFIX: El botón de opciones debe aparecer en TODOS los grupos (no solo para admins)
  // La restricción de admin se aplica DENTRO del modal, no en la visibilidad del botón
  const showGroupOptionsButton = !isDirectMessage;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#363636" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#D9B97E" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {displaySubtitle}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="videocam-outline" size={24} color="#D9B97E" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call-outline" size={24} color="#D9B97E" />
        </TouchableOpacity>

        {showGroupOptionsButton && (
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={() => setShowGroupInfo(true)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#D9B97E" />
          </TouchableOpacity>
        )}
      </View>

      <ChatScreen
        groupId={group.id_group}
        userId={userId!}
        token={token}
        isAdmin={isAdmin}
        userFullName={authStore.user?.full_name || 'Usuario'}
        serverUrl={WEBSOCKET_URL}
        group={group}
      />

      {showGroupOptionsButton && (
        <GroupInfoModal 
          groupId={group.id_group}
          visible={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          scrollToAccept={autoOpenAccept === 'true'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#363636',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerAction: {
    padding: 8,
  },
  infoButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4d4d',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#D9B97E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
