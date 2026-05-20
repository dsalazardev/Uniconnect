import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useEvents } from '@/features/events/hooks';
import { authStore } from '@/features/auth/store/AuthStore';
import { EventList } from '@/features/events/components';
import { CreateEventModal, EditEventModal } from '@/features/events/components';
import { EventFilters } from '@/features/events/components';
import { LoadingSpinner } from '@/components/elements';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { CreateEventFormPayload } from '@/features/events/components/CreateEventModal';
import type { Event, CreateEventPayload, UpdateEventPayload } from '@uniconnect/shared';
import { EventType } from '@uniconnect/shared';

export const EventsPage: React.FC = observer(() => {
  const {
    events,
    loading,
    error,
    filters,
    setFilter,
    clearFilters,
    createEvent,
    updateEvent,
    deleteEvent,
    isCreating,
    isUpdating,
  } = useEvents();

  const [createModalVisible, setCreateModalVisible] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);

  const currentUser = authStore.user;
  const canCreate = currentUser?.role?.name === 'admin' || currentUser?.role?.name === 'superadmin';

  const handleCreate = async (data: CreateEventFormPayload) => {
    const payload: CreateEventPayload = {
      title: data.title,
      description: data.description,
      location: data.location,
      date: data.start_date,
      time: data.start_date,
      type: EventType.CONFERENCIA,
    };
    const success = await createEvent(payload);
    if (success) setCreateModalVisible(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (id: number, payload: UpdateEventPayload) => {
    const success = await updateEvent(id, payload);
    if (success) {
      setEditModalVisible(false);
      setEditingEvent(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingEventId(id);
  };

  const confirmDeleteEvent = async () => {
    if (deletingEventId === null) return;
    await deleteEvent(deletingEventId);
    setDeletingEventId(null);
  };

  if (loading && events.length === 0) {
    return (
      <div>
        <h1>Eventos</h1>
        <LoadingSpinner size="lg" label="Cargando eventos..." />
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div>
        <h1>Eventos</h1>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Eventos</h1>
        {canCreate && (
          <button onClick={() => setCreateModalVisible(true)} style={{ padding: '0.5rem 1rem' }}>
            Crear Evento
          </button>
        )}
      </div>

      <EventFilters filters={filters} onFilterChange={setFilter} onClearFilters={clearFilters} />

      <EventList
        events={events}
        currentUser={currentUser ?? undefined}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateEventModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
      />

      {editingEvent && (
        <EditEventModal
          visible={editModalVisible}
          event={editingEvent}
          onClose={() => {
            setEditModalVisible(false);
            setEditingEvent(null);
          }}
          onSave={(id: number, payload: UpdateEventPayload) => handleSaveEdit(id, payload)}
          isSubmitting={isUpdating}
        />
      )}

      <ConfirmModal
        visible={deletingEventId !== null}
        title="Eliminar evento"
        message="¿Estás seguro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteEvent}
        onCancel={() => setDeletingEventId(null)}
      />
    </div>
  );
});
