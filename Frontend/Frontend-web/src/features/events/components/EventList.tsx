import React from 'react';
import type { Event, User } from '@uniconnect/shared';
import { EventCard } from './EventCard';
import styles from './EventList.module.css';

export interface EventListProps {
  events?: Event[] | undefined | null;
  currentUser?: User;
  onEdit?: (event: Event) => void;
  onDelete?: (id: number) => void;
}

/**
 * EventList - Pure component for displaying a list of events
 * Receives events array as prop
 * No business logic or network calls
 */
export const EventList: React.FC<EventListProps> = ({ events, currentUser, onEdit, onDelete }) => {
  const safeEvents = Array.isArray(events) ? events : [];

  if (safeEvents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>No hay eventos disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {safeEvents.map((event) => (
        <EventCard 
          key={event.id_event}
          event={event} 
          currentUser={currentUser}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
