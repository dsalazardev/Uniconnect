import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/constants/api';
import { websocketService } from '@/src/features/messages/services/websocket.service';
import { showToast } from '@/src/lib/toast';

// ── Local types (new schema) ────────────────────────────────────────────────
interface EventCategory {
  id_category: number;
  name: string;
  color: string;
}

interface EventV2 {
  id_event: number;
  id_category: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  category?: EventCategory;
}

type EventStatus = 'UPCOMING' | 'ONGOING' | 'FINISHED';

// ── Helpers ─────────────────────────────────────────────────────────────────
function getEventStatus(startDate: string): EventStatus {
  const now = new Date();
  const start = new Date(startDate);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  if (start >= todayStart && start < todayEnd) return 'ONGOING';
  if (start >= todayEnd) return 'UPCOMING';
  return 'FINISHED';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const STATUS_LABEL: Record<EventStatus, string> = {
  UPCOMING: 'Próximo',
  ONGOING: 'En curso',
  FINISHED: 'Finalizado',
};

const STATUS_COLOR: Record<EventStatus, string> = {
  UPCOMING: '#D9B97E',
  ONGOING: '#34d399',
  FINISHED: '#6B7280',
};

// ── EventCard (inline) ───────────────────────────────────────────────────────
const EventCard = React.memo(({ event }: { event: EventV2 }) => {
  const status = getEventStatus(event.start_date);
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[status] }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>
            {STATUS_LABEL[status]}
          </Text>
        </View>
        {event.category && (
          <View style={[styles.categoryDot, { backgroundColor: event.category.color }]} />
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
      <View style={styles.cardMeta}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>{formatDate(event.start_date)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
        </View>
      </View>
    </View>
  );
});

// ── Main screen ──────────────────────────────────────────────────────────────
const EventsScreen: React.FC = () => {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [events, setEvents] = useState<EventV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState<Set<number>>(new Set());
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const selectedCategoryRef = useRef<number | null>(null);
  useEffect(() => { selectedCategoryRef.current = selectedCategoryId; }, [selectedCategoryId]);

  // ── Load categories ────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/categories')
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategories([]));
  }, []);

  // ── Load subscriptions ─────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/events/categories/subscriptions')
      .then((r) => {
        const list: number[] = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setSubscribed(new Set(list));
      })
      .catch(() => { /* treat all as unsubscribed */ });
  }, []);

  // ── Load events when category changes ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = selectedCategoryId ? { categoryId: selectedCategoryId } : {};
    api.get('/events', { params })
      .then((r) => {
        if (!cancelled) {
          const data: EventV2[] = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
          setEvents(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError((err as Error).message ?? 'Error al cargar eventos');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedCategoryId]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!websocketService.isConnected()) {
      websocketService.connect();
    }

    websocketService.setOnReconnectCallback(() => {
      // Nada que re-unir: las notificaciones llegan por user-room, no por sala de grupo
    });

    const onEventPublished = (payload: { event: EventV2; categoryId?: number }) => {
      showToast.info(`Nuevo evento: ${payload.event?.title ?? 'Sin título'}`);

      const publishedCategory = payload.categoryId ?? payload.event?.id_category ?? null;
      const active = selectedCategoryRef.current;

      if (active === null || active === publishedCategory) {
        setEvents((prev) => {
          if (prev.some((e) => e.id_event === payload.event.id_event)) return prev;
          return [payload.event, ...prev];
        });
      }
    };

    websocketService.on('event:published', onEventPublished);

    return () => {
      websocketService.off('event:published', onEventPublished);
      websocketService.setOnReconnectCallback(null);
    };
  }, []);

  // ── Toggle subscription ────────────────────────────────────────────────────
  const toggleSubscription = async (categoryId: number) => {
    if (togglingId === categoryId) return;
    setTogglingId(categoryId);

    const wasSubscribed = subscribed.has(categoryId);
    setSubscribed((prev) => {
      const next = new Set(prev);
      wasSubscribed ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });

    try {
      if (wasSubscribed) {
        await api.delete(`/events/categories/${categoryId}/subscribe`);
      } else {
        await api.post(`/events/categories/${categoryId}/subscribe`);
      }
    } catch {
      setSubscribed((prev) => {
        const next = new Set(prev);
        wasSubscribed ? next.add(categoryId) : next.delete(categoryId);
        return next;
      });
      showToast.error('No se pudo actualizar la suscripción');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos universitarios</Text>
        <Text style={styles.headerSub}>Explora los eventos de tu programa</Text>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {/* "Todos" chip (no bell) */}
        <TouchableOpacity
          style={[styles.chip, selectedCategoryId === null && styles.chipActive]}
          onPress={() => setSelectedCategoryId(null)}
        >
          <Text style={[styles.chipText, selectedCategoryId === null && styles.chipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const isActive = selectedCategoryId === cat.id_category;
          const isSub = subscribed.has(cat.id_category);
          const isToggling = togglingId === cat.id_category;

          return (
            <View key={cat.id_category} style={styles.chipGroup}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  styles.chipWithBell,
                  isActive && styles.chipActive,
                ]}
                onPress={() => setSelectedCategoryId(cat.id_category)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bellBtn, isSub && styles.bellBtnActive]}
                onPress={() => toggleSubscription(cat.id_category)}
                disabled={isToggling}
              >
                {isToggling ? (
                  <ActivityIndicator size={10} color="#D9B97E" />
                ) : (
                  <Ionicons
                    name={isSub ? 'notifications' : 'notifications-off-outline'}
                    size={12}
                    color={isSub ? '#D9B97E' : '#6B7280'}
                  />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading && (
        <View style={styles.centerMsg}>
          <ActivityIndicator color="#D9B97E" />
          <Text style={styles.centerText}>Cargando eventos...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centerMsg}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => setSelectedCategoryId((prev) => prev)}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && events.length === 0 && (
        <View style={styles.centerMsg}>
          <Ionicons name="calendar-outline" size={40} color="#444" />
          <Text style={styles.centerText}>No hay eventos en esta categoría</Text>
        </View>
      )}

      {!loading && !error && events.length > 0 && (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id_event)}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f0f0f0',
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
  },

  // ── Chips ──────────────────────────────────────────────────────────────────
  chipsRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  chipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipWithBell: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  chipActive: {
    backgroundColor: 'rgba(217,185,126,0.15)',
    borderColor: 'rgba(217,185,126,0.55)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  chipTextActive: {
    color: '#D9B97E',
  },
  bellBtn: {
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtnActive: {
    backgroundColor: 'rgba(217,185,126,0.1)',
    borderColor: 'rgba(217,185,126,0.4)',
  },

  // ── States ─────────────────────────────────────────────────────────────────
  centerMsg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  centerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#f87171',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  retryText: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // ── List ───────────────────────────────────────────────────────────────────
  listContent: {
    padding: 16,
    gap: 12,
  },

  // ── Card ───────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f0f0f0',
    lineHeight: 21,
  },
  cardMeta: {
    gap: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
});

export default EventsScreen;
