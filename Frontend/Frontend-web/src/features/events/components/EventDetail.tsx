import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Pencil, Trash2, FileText, Calendar, MapPin } from 'lucide-react';
import type { Event } from '@uniconnect/shared';
import { EventType } from '@uniconnect/shared';
import { eventsService } from '../services';
import { authStore } from '@/features/auth/store/AuthStore';
import { EditEventModal } from './EditEventModal';
import styles from './EventDetail.module.css';

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const userId = authStore.user?.id_user;
  const userRole = authStore.user?.role?.name || authStore.user?.roleName;

  // Verificar si el usuario puede editar el evento
  const canEdit = React.useMemo(() => {
    if (!event || !userId) return false;
    return userRole === 'superadmin' || event.created_by === userId;
  }, [event, userId, userRole]);

  useEffect(() => {
    const loadEventDetail = async () => {
      try {
        setLoading(true);
        const eventId = parseInt(id as string);
        
        const response = await eventsService.getEventById(eventId);
        
        if (response.success && response.data) {
          setEvent(response.data);
          setError(null);
        } else {
          setError(response.error?.message || 'Evento no encontrado');
        }
      } catch (err: any) {
        console.error('Error loading event:', err);
        setError(err.message || 'Error al cargar el evento');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEventDetail();
    }
  }, [id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleDelete = async () => {
    if (!event) return;

    if (window.confirm('¿Estás seguro? Esta acción no se puede deshacer')) {
      try {
        await eventsService.deleteEvent(event.id_event);
        window.alert('Evento eliminado correctamente');
        navigate(-1);
      } catch (error: any) {
        window.alert(error.message || 'No se pudo eliminar el evento');
      }
    }
  };

  const handleSave = async (id: number, payload: any) => {
    try {
      setIsUpdating(true);
      const response = await eventsService.updateEvent(id, payload);

      if (response.success && response.data) {
        setEditModalVisible(false);
        setEvent(response.data);
        window.alert('Evento actualizado correctamente');
      } else {
        window.alert(response.error?.message || 'No se pudo actualizar el evento');
      }
    } catch (error: any) {
      window.alert(error.message || 'No se pudo actualizar el evento');
    } finally {
      setIsUpdating(false);
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
      [EventType.CONFERENCIA]: '#0056b3',
      [EventType.TALLER]: '#28a745',
      [EventType.SEMINARIO]: '#6f42c1',
      [EventType.COMPETENCIA]: '#fd7e14',
      [EventType.CULTURAL]: '#e83e8c',
      [EventType.DEPORTIVO]: '#20c997',
    };
    return colors[type];
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <ArrowLeft size={20} /> Volver
          </button>
          <h1 className={styles.headerTitle}>Cargando...</h1>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <ArrowLeft size={20} /> Volver
          </button>
          <h1 className={styles.headerTitle}>Error</h1>
        </div>
        <div className={styles.errorContainer}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <p className={styles.errorText}>{error || 'Evento no encontrado'}</p>
          <button className={styles.retryButton} onClick={handleGoBack}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <ArrowLeft size={20} /> Volver
          </button>
          <h1 className={styles.headerTitle}>Detalle del Evento</h1>
          
          {canEdit && (
            <div className={styles.headerActions}>
              <button onClick={handleEdit} className={styles.headerAction}>
                <Pencil size={20} />
              </button>
              <button onClick={handleDelete} className={styles.headerActionDelete}>
                <Trash2 size={20} />
              </button>
            </div>
          )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Event Type Badge */}
        <div className={styles.typeBadge} style={{ backgroundColor: getEventTypeColor(event.type) }}>
          <span className={styles.typeText}>{getEventTypeLabel(event.type)}</span>
        </div>

        {/* Title */}
        <h2 className={styles.title}>{event.title}</h2>

        {/* Description */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FileText size={20} className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Descripción</h3>
          </div>
          <p className={styles.description}>{event.description}</p>
        </div>

        {/* Date and Time */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Calendar size={20} className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Fecha y Hora</h3>
          </div>
          <p className={styles.detailText}>{formatDate(event.date)}</p>
          <p className={styles.detailText}>Hora: {event.time}</p>
        </div>

        {/* Location */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <MapPin size={20} className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Ubicación</h3>
          </div>
          <p className={styles.detailText}>{event.location}</p>
        </div>
      </div>

      {/* Edit Modal */}
      <EditEventModal
        visible={editModalVisible}
        event={event}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSave}
        isSubmitting={isUpdating}
      />
    </div>
  );
};
