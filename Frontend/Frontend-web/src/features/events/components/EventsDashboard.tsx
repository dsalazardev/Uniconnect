import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Calendar, Clock, MapPin, Plus, X } from 'lucide-react';
import { api } from '@/constants/api';
import { authStore } from '@/features/auth/store/AuthStore';
import { websocketService } from '@/features/messages/services/websocket.service';
import { showToast } from '@/lib/toast';
import styles from './EventsDashboard.module.css';

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
  created_by: number;
  category?: EventCategory;
  creator?: { id_user: number; full_name: string; picture?: string };
}

type EventStatus = 'UPCOMING' | 'ONGOING' | 'FINISHED';

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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Main component ───────────────────────────────────────────────────────────
export const EventsDashboard: React.FC = () => {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [events, setEvents] = useState<EventV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState<Set<number>>(new Set());
  const [togglingSubscription, setTogglingSubscription] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    id_category: '' as number | '',
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
  });

  const selectedCategoryRef = useRef<number | null>(null);
  useEffect(() => {
    selectedCategoryRef.current = selectedCategoryId === '' ? null : selectedCategoryId;
  }, [selectedCategoryId]);

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
      .catch(() => {});
  }, []);

  // ── Load events when filter changes ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = selectedCategoryId !== '' ? { categoryId: selectedCategoryId } : {};
    api.get('/events', { params })
      .then((r) => {
        if (!cancelled) setEvents(Array.isArray(r.data) ? r.data : r.data?.data ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError((err as Error).message ?? 'Error al cargar eventos');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedCategoryId]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const serverUrl = (import.meta as any).env?.VITE_WEBSOCKET_URL || 'http://localhost:8007';
    if (!websocketService.isConnected()) websocketService.connect(serverUrl);

    // Identificar al usuario en el servidor para unirse a su room personal (user-{id})
    // sin necesidad de estar en un grupo — necesario para recibir notificaciones de eventos
    const identify = () => {
      const userId = authStore.user?.id_user;
      if (userId) websocketService.emit('user:identify', { id_user: userId });
    };
    identify();
    websocketService.setOnReconnectCallback(identify);

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

  // ── Toggle subscription for selected category ──────────────────────────────
  const handleToggleSubscription = async () => {
    if (selectedCategoryId === '' || togglingSubscription) return;
    const catId = selectedCategoryId as number;
    setTogglingSubscription(true);

    const wasSubscribed = subscribed.has(catId);
    setSubscribed((prev) => {
      const next = new Set(prev);
      wasSubscribed ? next.delete(catId) : next.add(catId);
      return next;
    });

    try {
      if (wasSubscribed) {
        await api.delete(`/events/categories/${catId}/subscribe`);
      } else {
        await api.post(`/events/categories/${catId}/subscribe`);
        showToast.success('Suscrito', 'Recibirás notificaciones de esta categoría');
      }
    } catch {
      setSubscribed((prev) => {
        const next = new Set(prev);
        wasSubscribed ? next.add(catId) : next.delete(catId);
        return next;
      });
      showToast.error('No se pudo actualizar la suscripción');
    } finally {
      setTogglingSubscription(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.id_category === '') return;
    setCreating(true);
    try {
      const { data: newEvent } = await api.post('/events', {
        ...createForm,
        id_category: Number(createForm.id_category),
      });
      setEvents((prev) => [newEvent, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ id_category: '', title: '', description: '', location: '', start_date: '', end_date: '' });
      showToast.success('Evento creado', newEvent.title);
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'No se pudo crear el evento');
    } finally {
      setCreating(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id_category === selectedCategoryId);
  const isSubscribed = selectedCategoryId !== '' && subscribed.has(selectedCategoryId as number);
  const statusLabel: Record<EventStatus, string> = {
    UPCOMING: 'Próximo',
    ONGOING: 'En curso',
    FINISHED: 'Finalizado',
  };

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className={styles.pageTitle}>Eventos Académicos</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#D9B97E', color: '#111', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontWeight: 700,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Crear evento
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterSection}>
          <label className={styles.filterLabel}>Categoría</label>
          <select
            className={`${styles.filterSelect} ${selectedCategoryId !== '' ? styles.filterSelectActive : ''}`}
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id_category} value={cat.id_category}>
                {cat.name}
                {subscribed.has(cat.id_category) ? ' 🔔' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Bell subscription — visible only when a category is selected */}
        {selectedCategoryId !== '' && (
          <button
            className={`${styles.bellBtn} ${isSubscribed ? styles.bellBtnActive : ''}`}
            onClick={handleToggleSubscription}
            disabled={togglingSubscription}
            title={isSubscribed ? `Cancelar suscripción a ${selectedCategory?.name}` : `Suscribirse a ${selectedCategory?.name}`}
          >
            {isSubscribed
              ? <><Bell size={15} fill="currentColor" /> Suscrito</>
              : <><BellOff size={15} /> Suscribirse</>
            }
          </button>
        )}
      </div>

      {/* ── States ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className={styles.stateMsg}>
          <div className={styles.spinner} />
          <span>Cargando eventos...</span>
        </div>
      )}

      {!loading && error && (
        <div className={styles.stateMsg}>
          <span className={styles.errorText}>{error}</span>
          <button
            className={styles.retryBtn}
            onClick={() => setSelectedCategoryId((prev) => prev)}
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className={styles.stateMsg}>
          <span>No hay eventos en esta categoría</span>
        </div>
      )}

      {/* ── Event grid ─────────────────────────────────────────────────────── */}
      {!loading && !error && events.length > 0 && (
        <div className={styles.grid}>
          {events.map((event) => {
            const status = getEventStatus(event.start_date);
            const catColor = event.category?.color ?? '#D9B97E';
            return (
              <div key={event.id_event} className={styles.card}>

                {/* Category badge */}
                <div
                  className={styles.typeBadge}
                  style={{ backgroundColor: catColor }}
                >
                  <span className={styles.typeText}>
                    {event.category?.name ?? 'Evento'}
                  </span>
                </div>

                {/* Status badge */}
                <span className={`${styles.statusBadge} ${styles[`status${status}`]}`}>
                  {statusLabel[status]}
                </span>

                {/* Content */}
                <h3 className={styles.cardTitle}>{event.title}</h3>
                <p className={styles.cardDescription}>{event.description}</p>

                <div className={styles.detailsContainer}>
                  <div className={styles.detailRow}>
                    <Calendar size={16} className={styles.detailIcon} />
                    <span className={styles.detailText}>{formatDate(event.start_date)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <Clock size={16} className={styles.detailIcon} />
                    <span className={styles.detailText}>
                      {formatTime(event.start_date)}
                      {event.end_date && ` – ${formatTime(event.end_date)}`}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <MapPin size={16} className={styles.detailIcon} />
                    <span className={styles.detailText}>{event.location}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create event modal ───────────────────────────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div style={{
            background: '#2a2a2a', borderRadius: 12, padding: 28,
            width: '100%', maxWidth: 520,
            border: '1px solid rgba(217,185,126,0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>Crear evento</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Categoría */}
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 4 }}>Categoría *</label>
                <select
                  required
                  value={createForm.id_category}
                  onChange={(e) => setCreateForm((p) => ({ ...p, id_category: e.target.value === '' ? '' : Number(e.target.value) }))}
                  style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 14 }}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((c) => <option key={c.id_category} value={c.id_category}>{c.name}</option>)}
                </select>
              </div>

              {/* Título */}
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 4 }}>Título *</label>
                <input
                  required maxLength={300} value={createForm.title}
                  onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' }}
                  placeholder="Nombre del evento"
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 4 }}>Descripción *</label>
                <textarea
                  required maxLength={2000} rows={3} value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Descripción del evento"
                />
              </div>

              {/* Lugar */}
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 4 }}>Lugar *</label>
                <input
                  required maxLength={300} value={createForm.location}
                  onChange={(e) => setCreateForm((p) => ({ ...p, location: e.target.value }))}
                  style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' }}
                  placeholder="Auditorio, salón, etc."
                />
              </div>

              {/* Fechas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 4 }}>Inicio *</label>
                  <input
                    type="datetime-local" required value={createForm.start_date}
                    onChange={(e) => setCreateForm((p) => ({ ...p, start_date: e.target.value }))}
                    style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 4 }}>Fin *</label>
                  <input
                    type="datetime-local" required value={createForm.end_date}
                    onChange={(e) => setCreateForm((p) => ({ ...p, end_date: e.target.value }))}
                    style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box', colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowCreateModal(false)}
                  style={{ background: 'none', border: '1px solid #555', color: '#aaa', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  style={{ background: '#D9B97E', color: '#111', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: 14, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}>
                  {creating ? 'Creando...' : 'Crear evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
