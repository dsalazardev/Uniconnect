import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studySessionsMobileService } from '@/src/features/study-sessions/services/study-sessions.service';
import type { StudySessionInstance } from '@uniconnect/shared';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SessionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const groupId = parseInt(id as string);

  const [sessions, setSessions] = useState<StudySessionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await studySessionsMobileService.getSessionsByGroup(groupId);
      setSessions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar sesiones');
    }
  }, [groupId]);

  useEffect(() => {
    setLoading(true);
    loadSessions().finally(() => setLoading(false));
  }, [loadSessions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: StudySessionInstance }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: '/groups/[id]/sessions/[instanceId]',
          params: { id: String(groupId), instanceId: String(item.id_instance) },
        } as any)
      }
    >
      <View style={styles.cardHeader}>
        <Ionicons name="calendar-outline" size={18} color="#D9B97E" />
        <Text style={styles.cardDate}>{formatDateTime(item.scheduled_date)}</Text>
        {item.is_recurring && (
          <View style={styles.badge}>
            <Ionicons name="repeat" size={10} color="#D9B97E" />
            <Text style={styles.badgeText}>Recurrente</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.cardMeta}>
        <Ionicons name="time-outline" size={14} color="#6B7280" />
        <Text style={styles.cardMetaText}>{item.duration_minutes} min</Text>
        <Ionicons name="chevron-forward" size={14} color="#6B7280" style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#D9B97E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sesiones de estudio</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D9B97E" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); loadSessions().finally(() => setLoading(false)); }}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id_instance)}
          renderItem={renderItem}
          contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D9B97E" />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={48} color="#444" />
              <Text style={styles.emptyText}>No hay sesiones programadas</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
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
  backButton: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyContainer: { flexGrow: 1 },
  listContent: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.15)',
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardDate: { fontSize: 13, color: '#9CA3AF', flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217,185,126,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#D9B97E' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 13, color: '#6B7280' },
  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center' },
  retryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  retryText: { fontSize: 13, color: '#9CA3AF' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
