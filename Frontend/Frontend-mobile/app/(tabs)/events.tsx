import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/constants/api';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { websocketService } from '@/src/features/messages/services/websocket.service';
import { showToast } from '@/src/lib/toast';
import { CreateEventModal, type CreateEventFormPayload } from '@/src/features/events/components/CreateEventModal';

// ── Local types ──────────────────────────────────────────────────────────────
interface EventCategory { id_category: number; name: string; color: string; }
interface EventV2 {
  id_event: number; id_category: number; title: string; description: string;
  location: string; start_date: string; end_date: string; status: string;
  category?: EventCategory;
}
type EventStatus = 'UPCOMING' | 'ONGOING' | 'FINISHED';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getEventStatus(startDate: string): EventStatus {
  const now = new Date();
  const start = new Date(startDate);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  if (start >= todayStart && start < todayEnd) return 'ONGOING';
  if (start >= todayEnd) return 'UPCOMING';
  return 'FINISHED';
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<EventStatus, string> = { UPCOMING: 'Próximo', ONGOING: 'En curso', FINISHED: 'Finalizado' };
const STATUS_BG:    Record<EventStatus, string> = { UPCOMING: 'rgba(217,185,126,0.15)', ONGOING: 'rgba(52,211,153,0.12)',   FINISHED: 'rgba(107,114,128,0.15)' };
const STATUS_BORDER:Record<EventStatus, string> = { UPCOMING: 'rgba(217,185,126,0.35)', ONGOING: 'rgba(52,211,153,0.3)',    FINISHED: 'rgba(107,114,128,0.3)'  };
const STATUS_COLOR: Record<EventStatus, string> = { UPCOMING: '#D9B97E',                ONGOING: '#34d399',                 FINISHED: '#6B7280'                };

// ── Custom Select ─────────────────────────────────────────────────────────────
interface SelectOption { label: string; value: number | null; isSub?: boolean; }

const CustomSelect: React.FC<{
  options: SelectOption[];
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
  isActive: boolean;
}> = ({ options, value, onChange, placeholder, isActive }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <TouchableOpacity
        style={[styles.selectBtn, isActive && styles.selectBtnActive]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.selectBtnText, isActive && styles.selectBtnTextActive]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Categoría</Text>
            {options.map((opt) => {
              const isCurrent = opt.value === value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  style={[styles.modalOption, isCurrent && styles.modalOptionActive]}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                >
                  <Text style={[styles.modalOptionText, isCurrent && styles.modalOptionTextActive]}>
                    {opt.label}
                    {opt.isSub ? '  🔔' : ''}
                  </Text>
                  {isCurrent && <Ionicons name="checkmark" size={16} color="#D9B97E" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

// ── EventCard ─────────────────────────────────────────────────────────────────
const EventCard = React.memo(({ event }: { event: EventV2 }) => {
  const status = getEventStatus(event.start_date);
  const catColor = event.category?.color ?? '#D9B97E';
  return (
    <View style={styles.card}>
      <View style={styles.cardBadgeRow}>
        <View style={[styles.typeBadge, { backgroundColor: catColor }]}>
          <Text style={styles.typeText}>{event.category?.name ?? 'Evento'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[status], borderColor: STATUS_BORDER[status] }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>{STATUS_LABEL[status]}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>{event.description}</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={15} color="#6B7280" />
          <Text style={styles.detailText}>{formatDate(event.start_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={15} color="#6B7280" />
          <Text style={styles.detailText}>{formatTime(event.start_date)}{event.end_date ? ` – ${formatTime(event.end_date)}` : ''}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={15} color="#6B7280" />
          <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
        </View>
      </View>
    </View>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────
const EventsScreen: React.FC = () => {
  const [categories, setCategories]         = useState<EventCategory[]>([]);
  const [selectedCategoryId, setSelected]   = useState<number | null>(null);
  const [events, setEvents]                 = useState<EventV2[]>([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [subscribed, setSubscribed]         = useState<Set<number>>(new Set());
  const [togglingSubscription, setToggling] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating]               = useState(false);

  const canCreate = ['admin', 'superadmin'].includes(authStore.user?.role?.name ?? '');

  const selectedCategoryRef = useRef<number | null>(null);
  useEffect(() => { selectedCategoryRef.current = selectedCategoryId; }, [selectedCategoryId]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/events/categories/subscriptions')
      .then((r) => { const l: number[] = Array.isArray(r.data) ? r.data : r.data?.data ?? []; setSubscribed(new Set(l)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    const params = selectedCategoryId !== null ? { categoryId: selectedCategoryId } : {};
    api.get('/events', { params })
      .then((r) => { if (!cancelled) setEvents(Array.isArray(r.data) ? r.data : r.data?.data ?? []); })
      .catch((e: unknown) => { if (!cancelled) setError((e as Error).message ?? 'Error al cargar'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!websocketService.isConnected()) websocketService.connect();

    // Identificar al usuario para unirse a user-{id} room sin necesitar un grupo
    const identify = () => {
      const userId = authStore.user?.id_user;
      if (userId) websocketService.emit('user:identify', { id_user: userId });
    };
    identify();
    websocketService.setOnReconnectCallback(identify);

    const handler = (payload: { event: EventV2; categoryId?: number }) => {
      showToast.info(`Nuevo evento: ${payload.event?.title ?? 'Sin título'}`);
      const pubCat = payload.categoryId ?? payload.event?.id_category ?? null;
      const active = selectedCategoryRef.current;
      if (active === null || active === pubCat) {
        setEvents((prev) => {
          if (prev.some((e) => e.id_event === payload.event.id_event)) return prev;
          return [payload.event, ...prev];
        });
      }
    };
    websocketService.on('event:published', handler);
    return () => { websocketService.off('event:published', handler); websocketService.setOnReconnectCallback(null); };
  }, []);

  const handleToggleSubscription = async () => {
    if (selectedCategoryId === null || togglingSubscription) return;
    setToggling(true);
    const was = subscribed.has(selectedCategoryId);
    setSubscribed((prev) => { const n = new Set(prev); was ? n.delete(selectedCategoryId) : n.add(selectedCategoryId); return n; });
    try {
      if (was) { await api.delete(`/events/categories/${selectedCategoryId}/subscribe`); }
      else { await api.post(`/events/categories/${selectedCategoryId}/subscribe`); showToast.success('Suscrito', 'Recibirás notificaciones'); }
    } catch {
      setSubscribed((prev) => { const n = new Set(prev); was ? n.add(selectedCategoryId) : n.delete(selectedCategoryId); return n; });
      showToast.error('No se pudo actualizar la suscripción');
    } finally { setToggling(false); }
  };

  const handleCreateEvent = async (payload: CreateEventFormPayload) => {
    setCreating(true);
    try {
      const { data: newEvent } = await api.post('/events', payload);
      setEvents((prev) => [newEvent, ...prev]);
      setShowCreateModal(false);
      showToast.success('Evento creado', newEvent.title);
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'No se pudo crear el evento');
    } finally {
      setCreating(false);
    }
  };

  const isSubscribed = selectedCategoryId !== null && subscribed.has(selectedCategoryId);
  const selectOptions: SelectOption[] = [
    { label: 'Todas las categorías', value: null },
    ...categories.map((c) => ({ label: c.name, value: c.id_category, isSub: subscribed.has(c.id_category) })),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos Académicos</Text>
        {canCreate && (
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={18} color="#111" />
            <Text style={styles.createBtnText}>Crear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <View style={styles.filterBar}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Categoría</Text>
          <CustomSelect
            options={selectOptions}
            value={selectedCategoryId}
            onChange={setSelected}
            placeholder="Todas las categorías"
            isActive={selectedCategoryId !== null}
          />
        </View>

        {selectedCategoryId !== null && (
          <TouchableOpacity
            style={[styles.bellBtn, isSubscribed && styles.bellBtnActive]}
            onPress={handleToggleSubscription}
            disabled={togglingSubscription}
          >
            {togglingSubscription
              ? <ActivityIndicator size={14} color="#D9B97E" />
              : <>
                  <Ionicons
                    name={isSubscribed ? 'notifications' : 'notifications-off-outline'}
                    size={15}
                    color={isSubscribed ? '#D9B97E' : '#9CA3AF'}
                  />
                  <Text style={[styles.bellBtnText, isSubscribed && styles.bellBtnTextActive]}>
                    {isSubscribed ? 'Suscrito' : 'Suscribirse'}
                  </Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* ── States ──────────────────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.stateMsg}>
          <ActivityIndicator color="#D9B97E" size="large" />
          <Text style={styles.stateMsgText}>Cargando eventos...</Text>
        </View>
      )}
      {!loading && error && (
        <View style={styles.stateMsg}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setSelected((p) => p)}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
      {!loading && !error && events.length === 0 && (
        <View style={styles.stateMsg}>
          <Ionicons name="calendar-outline" size={44} color="#444" />
          <Text style={styles.stateMsgText}>No hay eventos en esta categoría</Text>
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

      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateEvent}
        isSubmitting={creating}
        categories={categories}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1e1e1e' },
  header:      { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  createBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D9B97E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#111' },

  // Filter bar
  filterBar: {
    backgroundColor: '#2a2a2a', borderRadius: 8,
    marginHorizontal: 16, marginBottom: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, gap: 10,
  },
  filterSection: { gap: 6 },
  filterLabel:   { fontSize: 14, fontWeight: '500', color: '#aaa' },

  // Custom select button
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: 'rgba(217,185,126,0.2)',
    borderRadius: 8, backgroundColor: '#1a1a1a',
    paddingHorizontal: 14, height: 48,
  },
  selectBtnActive: {
    borderColor: '#D9B97E',
    shadowColor: '#D9B97E', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  selectBtnText:       { fontSize: 15, color: '#6B7280', flex: 1, marginRight: 8 },
  selectBtnTextActive: { color: '#fff' },

  // Modal dropdown
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1e1e1e', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingTop: 12, paddingBottom: 32,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionActive:     { backgroundColor: 'rgba(217,185,126,0.08)' },
  modalOptionText:       { fontSize: 15, color: '#9CA3AF' },
  modalOptionTextActive: { color: '#D9B97E', fontWeight: '600' },

  // Bell button
  bellBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16,
  },
  bellBtnActive:     { backgroundColor: 'rgba(217,185,126,0.12)', borderColor: 'rgba(217,185,126,0.45)' },
  bellBtnText:       { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  bellBtnTextActive: { color: '#D9B97E' },

  // States
  stateMsg:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 48 },
  stateMsgText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  errorText:    { fontSize: 14, color: '#f87171', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:     { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 },
  retryText:    { fontSize: 13, color: '#9CA3AF' },
  listContent:  { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  // Card
  card: {
    backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(217,185,126,0.2)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cardBadgeRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge:       { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  typeText:        { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusBadge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusText:      { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardTitle:       { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6, lineHeight: 22 },
  cardDescription: { fontSize: 13, color: '#9CA3AF', lineHeight: 19, marginBottom: 12 },
  detailsContainer:{ gap: 7 },
  detailRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText:      { fontSize: 13, color: '#9CA3AF', flex: 1 },
});

export default EventsScreen;
