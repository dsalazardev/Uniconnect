import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { Event, User } from '@uniconnect/shared';
import { EventType } from '@uniconnect/shared';
import styles from './EventCard.module.css';

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
  const navigate = useNavigate();

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

  const handleCardClick = () => {
    navigate(`/events/${event.id_event}`);
  };

  const handleDelete = (): void => {
    if (window.confirm('¿Estás seguro? Esta acción no se puede deshacer')) {
      onDelete?.(event.id_event);
    }
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
      [EventType.CONFERENCIA]: '#D9B97E',
      [EventType.TALLER]: '#28a745',
      [EventType.SEMINARIO]: '#6f42c1',
      [EventType.COMPETENCIA]: '#fd7e14',
      [EventType.CULTURAL]: '#e83e8c',
      [EventType.DEPORTIVO]: '#20c997',
    };
    return colors[type];
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      {/* Event Type Badge */}
      <div className={styles.typeBadge} style={{ backgroundColor: getEventTypeColor(event.type) }}>
        <span className={styles.typeText}>{getEventTypeLabel(event.type)}</span>
      </div>

      {/* Edit Button */}
      {shouldShowEditButton && (
        <button 
          className={styles.editButton}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(event);
          }}
          aria-label="Editar evento"
          data-testid="edit-button"
        >
          <Pencil size={16} />
        </button>
      )}

      {/* Delete Button */}
      {shouldShowDeleteButton && (
        <button 
          className={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          aria-label="Eliminar evento"
          data-testid="delete-button"
        >
          <Trash2 size={16} />
        </button>
      )}

      {/* Event Title */}
      <h3 className={styles.title}>{event.title}</h3>

      {/* Event Description */}
      <p className={styles.description}>{event.description}</p>

      {/* Event Details */}
      <div className={styles.detailsContainer}>
        {/* Date */}
        <div className={styles.detailRow}>
          <Calendar size={18} className={styles.icon} />
          <span className={styles.detailText}>{formatDate(event.date)}</span>
        </div>

        {/* Time */}
        <div className={styles.detailRow}>
          <Clock size={18} className={styles.icon} />
          <span className={styles.detailText}>{event.time}</span>
        </div>

        {/* Location */}
        <div className={styles.detailRow}>
          <MapPin size={18} className={styles.icon} />
          <span className={styles.detailText}>{event.location}</span>
        </div>
      </div>
    </div>
  );
};
