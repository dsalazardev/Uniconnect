import React from 'react';
import type { Event, User } from '@uniconnect/shared';
import { EventType } from '@uniconnect/shared';
import { EventCard } from './EventCard';
import styles from './EventList.module.css';

export interface EventListProps {
  events: Event[] | undefined | null;
  currentUser?: User;
  onEdit?: (event: Event) => void;
  onDelete?: (id: number) => void;
}

/**
 * EventList - Pure component for displaying a list of events
 * Receives events array as prop
 * No business logic or network calls
 * 
 * ⭐ FIX CRÍTICO: Programación defensiva con Early Return
 */
export const EventList: React.FC<EventListProps> = ({ events, currentUser, onEdit, onDelete }) => {
  // ⭐ FIX CRÍTICO: Early Return - Validación temprana para evitar crash
  // Si events es undefined, null, o no es un array, usar array vacío
  const safeEvents = Array.isArray(events) ? events : [];

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
