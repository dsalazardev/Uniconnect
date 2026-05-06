import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Event } from '../types/event.types';
import { EventCard } from './EventCard';
import { User } from '@/src/features/auth/types/user.types';

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
    <FlatList
      data={safeEvents} // ⭐ GARANTÍA: Siempre pasar array válido
      keyExtractor={(item) => item.id_event.toString()}
      renderItem={({ item }) => (
        <EventCard 
          event={item} 
          currentUser={currentUser}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
});
