import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { eventsStore } from '../store/events.store';
import { waitForAuth } from '@/features/auth/lib/waitForAuth';
import type { EventFilters, CreateEventPayload, UpdateEventPayload } from '@uniconnect/shared';

export function useEvents() {
  useEffect(() => {
    const init = async () => {
      await waitForAuth();
      if (eventsStore.events.length === 0 && !eventsStore.loading) {
        eventsStore.loadEvents();
      }
    };
    init();
  }, []);

  return {
    events: eventsStore.events,
    loading: eventsStore.loading,
    error: eventsStore.error,
    filters: eventsStore.filters,
    metadata: eventsStore.metadata,
    upcomingEvents: eventsStore.upcomingEvents,
    isCreating: eventsStore.isCreating,
    createError: eventsStore.createError,
    isUpdating: eventsStore.isUpdating,
    updateError: eventsStore.updateError,
    loadEvents: () => eventsStore.loadEvents(),
    setFilter: (filterType: keyof EventFilters, value: any) => eventsStore.setFilter(filterType, value),
    clearFilters: () => eventsStore.clearFilters(),
    createEvent: (payload: CreateEventPayload) => eventsStore.createEvent(payload),
    updateEvent: (id: number, payload: UpdateEventPayload) => eventsStore.updateEvent(id, payload),
    deleteEvent: (id: number) => eventsStore.deleteEvent(id),
    clearCreateError: () => eventsStore.clearCreateError(),
    clearUpdateError: () => eventsStore.clearUpdateError(),
  };
}

export { eventsStore };
