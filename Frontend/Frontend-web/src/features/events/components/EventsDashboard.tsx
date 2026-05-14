import React, { useEffect, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import type { Event } from '@uniconnect/shared';
import { EventType } from '@uniconnect/shared';
import { eventsService } from '../services';
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

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Eventos universitarios</h1>
        <p className={styles.pageSubtitle}>Explora los eventos de tu programa</p>
      </div>

      <div className={styles.chips}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            className={`${styles.chip} ${selectedCategory === cat.value ? styles.chipActive : ''}`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

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
