import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authStore } from '@/src/features/auth';
import { eventsService } from '@/src/features/events/services';
import { Event, EventType } from '@/src/features/events/types/event.types';
import { EditEventModal } from '@/src/features/events/components';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        
        // Llamar al servicio para obtener el evento por ID
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
    router.back();
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleDelete = () => {
    if (!event) return;

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
          onPress: async () => {
            try {
              setIsDeleting(true);
              await eventsService.deleteEvent(event.id_event);
              Alert.alert('Éxito', 'Evento eliminado correctamente');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el evento');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async (id: number, payload: any) => {
    try {
      setIsUpdating(true);
      const response = await eventsService.updateEvent(id, payload);

      if (response.success && response.data) {
        setEditModalVisible(false);
        setEvent(response.data);
        Alert.alert('Éxito', 'Evento actualizado correctamente');
      } else {
        Alert.alert(
          'Error',
          response.error?.message || 'No se pudo actualizar el evento'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el evento');
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cargando...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D9B97E" />
          <Text style={styles.loadingText}>Cargando evento...</Text>
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff4d4d" />
          <Text style={styles.errorText}>{error || 'Evento no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleGoBack}>
            <Text style={styles.retryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Evento</Text>
        
        {canEdit && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.headerAction}>
              <Ionicons name="pencil-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.headerAction}>
              <Ionicons name="trash-outline" size={24} color="#ff4d4d" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Event Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: getEventTypeColor(event.type) }]}>
          <Text style={styles.typeText}>{getEventTypeLabel(event.type)}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#D9B97E" />
            <Text style={styles.sectionTitle}>Descripción</Text>
          </View>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* Date and Time */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#D9B97E" />
            <Text style={styles.sectionTitle}>Fecha y Hora</Text>
          </View>
          <Text style={styles.detailText}>{formatDate(event.date)}</Text>
          <Text style={styles.detailText}>Hora: {event.time}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#D9B97E" />
            <Text style={styles.sectionTitle}>Ubicación</Text>
          </View>
          <Text style={styles.detailText}>{event.location}</Text>
        </View>

        {/* Creator Info */}
        {(event as any).creator && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color="#D9B97E" />
              <Text style={styles.sectionTitle}>Organizador</Text>
            </View>
            <Text style={styles.detailText}>{(event as any).creator.full_name}</Text>
            {(event as any).creator.email && (
              <Text style={styles.detailSubtext}>{(event as any).creator.email}</Text>
            )}
          </View>
        )}

        {/* Program Info */}
        {(event as any).program && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school-outline" size={20} color="#D9B97E" />
              <Text style={styles.sectionTitle}>Programa</Text>
            </View>
            <Text style={styles.detailText}>{(event as any).program.name}</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <EditEventModal
        visible={editModalVisible}
        event={event}
        onClose={() => {
          setEditModalVisible(false);
        }}
        onSave={handleSave}
        isSubmitting={isUpdating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#363636',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 185, 126, 0.3)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  typeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D9B97E',
  },
  description: {
    fontSize: 15,
    color: '#aaa',
    lineHeight: 22,
  },
  detailText: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 4,
  },
  detailSubtext: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#363636',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#aaa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#363636',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4d4d',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#D9B97E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
