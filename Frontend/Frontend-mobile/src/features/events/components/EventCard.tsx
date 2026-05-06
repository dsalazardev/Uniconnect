import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Event, EventType } from '../types/event.types';
import { User } from '@/src/features/auth/types/user.types';

export interface EventCardProps {
  event: Event;
  currentUser?: User;
  onEdit?: (event: Event) => void;
  onDelete?: (id: number) => void;
}

/**
 * EventCard - Pure component for displaying a single event
 * Receives event object as prop
 * No business logic or network calls
 */
export const EventCard: React.FC<EventCardProps> = ({ event, currentUser, onEdit, onDelete }) => {
  const router = useRouter();

  // Calculate if edit button should be visible
  const shouldShowEditButton = currentUser && onEdit && (
    currentUser.role?.name === 'superadmin' || 
    event.created_by === currentUser.id_user
  );

  // Calculate if delete button should be visible
  const shouldShowDeleteButton = currentUser && onDelete && (
    currentUser.role?.name === 'superadmin' || 
    event.created_by === currentUser.id_user
  );

  const handleCardPress = () => {
    router.push(`/events/${event.id_event}`);
  };

  const handleDelete = (): void => {
    Alert.alert(
      '¿Estás seguro?',
      'Esta acción no se puede deshacer',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: () => onDelete?.(event.id_event),
        },
      ]
    );
  };
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEventTypeLabel = (type: EventType): string => {
    const labels: Record<EventType, string> = {
      [EventType.CONFERENCIA]: 'Conferencia',
      [EventType.TALLER]: 'Taller',
      [EventType.SEMINARIO]: 'Seminario',
      [EventType.COMPETENCIA]: 'Competencia',
      [EventType.CULTURAL]: 'Cultural',
      [EventType.DEPORTIVO]: 'Deportivo',
    };
    return labels[type];
  };

  const getEventTypeColor = (type: EventType): string => {
    const colors: Record<EventType, string> = {
      [EventType.CONFERENCIA]: '#0056b3',
      [EventType.TALLER]: '#28a745',
      [EventType.SEMINARIO]: '#6f42c1',
      [EventType.COMPETENCIA]: '#fd7e14',
      [EventType.CULTURAL]: '#e83e8c',
      [EventType.DEPORTIVO]: '#20c997',
    };
    return colors[type];
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      {/* Event Type Badge */}
      <View style={[styles.typeBadge, { backgroundColor: getEventTypeColor(event.type) }]}>
        <Text style={styles.typeText}>{getEventTypeLabel(event.type)}</Text>
      </View>

      {/* Edit Button */}
      {shouldShowEditButton && (
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={(e) => {
            e.stopPropagation();
            onEdit?.(event);
          }}
          accessibilityLabel="Editar evento"
          accessibilityRole="button"
          testID="edit-button"
        >
          <Ionicons name="pencil-outline" size={20} color="#D9B97E" />
        </TouchableOpacity>
      )}

      {/* Delete Button */}
      {shouldShowDeleteButton && (
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          accessibilityLabel="Eliminar evento"
          accessibilityRole="button"
          testID="delete-button"
        >
          <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
        </TouchableOpacity>
      )}

      {/* Event Title */}
      <Text style={styles.title}>{event.title}</Text>

      {/* Event Description */}
      <Text style={styles.description} numberOfLines={2}>
        {event.description}
      </Text>

      {/* Event Details */}
      <View style={styles.detailsContainer}>
        {/* Date */}
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#D9B97E" />
          <Text style={styles.detailText}>{formatDate(event.date)}</Text>
        </View>

        {/* Time */}
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#D9B97E" />
          <Text style={styles.detailText}>{event.time}</Text>
        </View>

        {/* Location */}
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#D9B97E" />
          <Text style={styles.detailText}>{event.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    backgroundColor: 'rgba(217, 185, 126, 0.15)',
    borderRadius: 20,
    zIndex: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 56,
    padding: 8,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderRadius: 20,
    zIndex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#aaa',
    flex: 1,
  },
});
