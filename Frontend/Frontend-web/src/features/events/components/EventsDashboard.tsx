import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Calendar, MapPin } from 'lucide-react';
import type { Event } from '@uniconnect/shared';
import { EventType } from '@uniconnect/shared';
import { eventsService } from '../services';
import { api } from '@/constants/api';
import { websocketService } from '@/features/messages/services/websocket.service';
import { showToast } from '@/lib/toast';
import styles from './EventsDashboard.module.css';

type EventStatus = 'UPCOMING' | 'ONGOING' | 'FINISHED';

interface Category {
  label: string;
  value: EventType | null;
}

const CATEGORIES: Category[] = [
  { label: 'Todos', value: null },
  { label: 'Conferencia', value: EventType.CONFERENCIA },
  { label: 'Taller', value: EventType.TALLER },
  { label: 'Seminario', value: EventType.SEMINARIO },
  { label: 'Competencia', value: EventType.COMPETENCIA },
  { label: 'Cultural', value: EventType.CULTURAL },
  { label: 'Deportivo', value: EventType.DEPORTIVO },
];

function getEventStatus(dateStr: string): EventStatus {
  const now = new Date();
  const eventDate = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  if (eventDate >= todayStart && eventDate < todayEnd) return 'ONGOING';
  if (eventDate >= todayEnd) return 'UPCOMING';
  return 'FINISHED';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const EventsDashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<EventType | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set of subscribed category values (EventType strings)
  const [subscribed, setSubscribed] = useState<Set<EventType>>(new Set());
  const [togglingSubscription, setTogglingSubscription] = useState<EventType | null>(null);

  // Ref so the WS handler always sees the current selected category without closure staleness
  const selectedCategoryRef = useRef<EventType | null>(null);
  useEffect(() => { selectedCategoryRef.current = selectedCategory; }, [selectedCategory]);

  // ── Load events when category changes ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await eventsService.getEvents(
          selectedCategory ? { type: selectedCategory } : {},
          { page: 1, pageSize: 50 },
        );
        if (!cancelled) {
          setEvents(res.success ? (res.data ?? []) : []);
          if (!res.success) setError(res.error?.message ?? 'Error al cargar eventos');
        }
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error).message ?? 'Error al cargar eventos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [selectedCategory]);

  // ── Load initial subscription state ────────────────────────────────────────
  useEffect(() => {
    api.get('/events/categories/subscriptions')
      .then((r) => {
        const list: EventType[] = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setSubscribed(new Set(list));
      })
      .catch(() => { /* subscriptions unavailable — treat all as unsubscribed */ });
  }, []);

  // ── WebSocket: connect + register event:published listener ─────────────────
  useEffect(() => {
    const serverUrl = (import.meta as any).env?.VITE_WEBSOCKET_URL || 'http://localhost:8007';

    if (!websocketService.isConnected()) {
      websocketService.connect(serverUrl);
    }

    // No room to join for events — just listen for global broadcasts
    websocketService.setOnReconnectCallback(() => {
      // Nothing to re-join; listener is on the socket level and auto-re-registers on reconnect
    });

    const onEventPublished = (payload: { event: Event; categoryId?: EventType }) => {
      showToast.info(`Nuevo evento: ${payload.event?.title ?? 'Sin título'}`);

      const publishedCategory = payload.categoryId ?? (payload.event?.type as EventType | undefined) ?? null;
      const active = selectedCategoryRef.current;

      // Prepend if it matches the active filter (or "Todos" / no filter)
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

  // ── Toggle subscription ─────────────────────────────────────────────────────
  const toggleSubscription = async (e: React.MouseEvent, categoryValue: EventType) => {
    e.stopPropagation();
    if (togglingSubscription === categoryValue) return;
    setTogglingSubscription(categoryValue);

    const wasSubscribed = subscribed.has(categoryValue);

    // Optimistic update
    setSubscribed((prev) => {
      const next = new Set(prev);
      wasSubscribed ? next.delete(categoryValue) : next.add(categoryValue);
      return next;
    });

    try {
      if (wasSubscribed) {
        await api.delete(`/events/categories/${categoryValue}/subscribe`);
      } else {
        await api.post(`/events/categories/${categoryValue}/subscribe`);
      }
    } catch {
      // Rollback on failure
      setSubscribed((prev) => {
        const next = new Set(prev);
        wasSubscribed ? next.add(categoryValue) : next.delete(categoryValue);
        return next;
      });
      showToast.error('No se pudo actualizar la suscripción');
    } finally {
      setTogglingSubscription(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Eventos universitarios</h1>
        <p className={styles.pageSubtitle}>Explora los eventos de tu programa</p>
      </div>

      {/* ── Category chips ───────────────────────────────────────────────────── */}
      <div className={styles.chips}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.value;
          const isSub = cat.value !== null && subscribed.has(cat.value);
          const isToggling = cat.value !== null && togglingSubscription === cat.value;

          return (
            <div key={cat.label} className={styles.chipWrapper}>
              <button
                className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </button>

              {cat.value !== null && (
                <button
                  className={`${styles.bellBtn} ${isSub ? styles.bellBtnActive : ''}`}
                  onClick={(e) => toggleSubscription(e, cat.value!)}
                  disabled={isToggling}
                  title={isSub ? 'Cancelar suscripción' : 'Suscribirse a esta categoría'}
                  aria-label={isSub ? `Cancelar suscripción a ${cat.label}` : `Suscribirse a ${cat.label}`}
                >
                  {isSub
                    ? <Bell size={12} fill="currentColor" />
                    : <BellOff size={12} />
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── States ──────────────────────────────────────────────────────────── */}
      {loading && (
        <div className={styles.centerMsg}>
          <span>Cargando eventos...</span>
        </div>
      )}

      {!loading && error && (
        <div className={styles.centerMsg}>
          <span className={styles.errorMsg}>{error}</span>
          <button
            className={styles.retryBtn}
            onClick={() => setSelectedCategory((prev) => prev)}
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className={styles.centerMsg}>
          <span>No hay eventos en esta categoría</span>
        </div>
      )}

      {/* ── Events grid ─────────────────────────────────────────────────────── */}
      {!loading && !error && events.length > 0 && (
        <div className={styles.grid}>
          {events.map((event) => {
            const status = getEventStatus(event.date);
            return (
              <div key={event.id_event} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={`${styles.statusBadge} ${styles[`status${status}`]}`}>
                    {status === 'UPCOMING' ? 'Próximo' : status === 'ONGOING' ? 'En curso' : 'Finalizado'}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{event.title}</h3>
                <div className={styles.cardMeta}>
                  <span className={styles.cardMetaRow}>
                    <Calendar size={14} className={styles.metaIcon} />
                    {formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}
                  </span>
                  <span className={styles.cardMetaRow}>
                    <MapPin size={14} className={styles.metaIcon} />
                    {event.location}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
