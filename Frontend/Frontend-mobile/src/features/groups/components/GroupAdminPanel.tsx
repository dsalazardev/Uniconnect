import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { groupAdminStore } from '../store/GroupAdminStore';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { RequestRow } from './GroupAdmin/RequestRow';
import { MemberRow } from './GroupAdmin/MemberRow';
import { GroupSelector } from './GroupAdmin/GroupSelector';
import { adminStyles as s } from './GroupAdmin/styles';

export interface GroupAdminPanelProps {
  /** Modo grupo único — se pasa desde GroupInfoModal */
  groupId?: number;
  /** ID del owner para calcular permisos de gestión */
  ownerId?: number;
  /** Habilita botones de sacar/promover miembros */
  canManage?: boolean;
}

export const GroupAdminPanel = observer(
  ({ groupId, ownerId, canManage = false }: GroupAdminPanelProps) => {
    const currentOwnerId = ownerId ?? authStore.user?.id_user ?? 0;

    const load = useCallback(async () => {
      await groupAdminStore.fetchPendingRequests();
      const targetId = groupId ?? groupAdminStore.groupsWithRequests[0]?.id_group ?? null;
      if (targetId) {
        groupAdminStore.setActiveGroup(targetId);
        await groupAdminStore.fetchMembers(targetId);
      }
    }, [groupId]);

    // Carga inicial
    useEffect(() => {
      load();
      return () => { if (!groupId) groupAdminStore.reset(); };
    }, [load, groupId]);

    // Recarga miembros al cambiar de grupo activo
    useEffect(() => {
      if (groupAdminStore.activeGroupId) {
        groupAdminStore.fetchMembers(groupAdminStore.activeGroupId);
      }
    }, [groupAdminStore.activeGroupId]);

    const activeId = groupAdminStore.activeGroupId;
    const pendingRequests = groupAdminStore.activePendingRequests;

    // ── Pantalla de carga inicial ──────────────────────────────────────────
    if (groupAdminStore.isLoading && groupAdminStore.groupsWithRequests.length === 0) {
      return (
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color="#D9B97E" />
          <Text style={s.loadingText}>Cargando panel de administración...</Text>
        </View>
      );
    }

    // ── Error bloqueante (sin datos) ───────────────────────────────────────
    if (groupAdminStore.error && groupAdminStore.groupsWithRequests.length === 0) {
      return (
        <View style={s.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={s.errorText}>{groupAdminStore.error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de error inline (no bloquea la UI) */}
        {groupAdminStore.error && (
          <TouchableOpacity
            style={s.errorBanner}
            onPress={() => groupAdminStore.clearError()}
            accessibilityLabel="Cerrar error"
          >
            <Ionicons name="warning-outline" size={16} color="#FCA5A5" />
            <Text style={s.errorBannerText}>{groupAdminStore.error}</Text>
            <Ionicons name="close" size={14} color="#FCA5A5" />
          </TouchableOpacity>
        )}

        {/* Chips de selección de grupo (visible solo con múltiples grupos) */}
        <GroupSelector />

        {/* ── Sección: Solicitudes pendientes ─────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="people-circle-outline" size={20} color="#F97316" />
            <Text style={[s.sectionTitle, { color: '#F97316' }]}>
              Solicitudes pendientes
            </Text>
            {pendingRequests.length > 0 && (
              <View style={s.countBadge}>
                <Text style={s.countBadgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </View>

          {groupAdminStore.isLoading ? (
            <ActivityIndicator size="small" color="#F97316" style={s.inlineLoader} />
          ) : pendingRequests.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={36} color="#4ADE80" />
              <Text style={s.emptyText}>Sin solicitudes pendientes</Text>
            </View>
          ) : (
            pendingRequests.map((req) => (
              <RequestRow key={req.id_request} request={req} groupId={activeId!} />
            ))
          )}
        </View>

        {/* ── Sección: Miembros actuales ───────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="people-outline" size={20} color="#D9B97E" />
            <Text style={s.sectionTitle}>Miembros actuales</Text>
            {groupAdminStore.members.length > 0 && (
              <View style={[s.countBadge, s.countBadgeGold]}>
                <Text style={s.countBadgeText}>{groupAdminStore.members.length}</Text>
              </View>
            )}
          </View>

          {groupAdminStore.isMembersLoading ? (
            <ActivityIndicator size="small" color="#D9B97E" style={s.inlineLoader} />
          ) : groupAdminStore.members.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="person-outline" size={36} color="#666" />
              <Text style={s.emptyText}>No hay miembros aún</Text>
            </View>
          ) : (
            groupAdminStore.members.map((member) => (
              <MemberRow
                key={member.id_membership}
                member={member}
                groupId={activeId!}
                ownerId={currentOwnerId}
                canManage={canManage}
              />
            ))
          )}
        </View>
      </ScrollView>
    );
  },
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 32,
  },
});
