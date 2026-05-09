import { makeAutoObservable, runInAction } from 'mobx';
import { eventsService } from '../services';
import type {
  EventsService,
  Event,
  EventFilters,
  PaginationMetadata,
  CreateEventPayload,
  UpdateEventPayload,
} from '@uniconnect/shared';

/**
 * EventsStore - Model layer using MobX
 * Manages state for events, filters, loading, and errors
 * Follows MVC pattern with complete decoupling from View layer
 * 
 * Uses makeAutoObservable pattern (MobX 6+) instead of decorators
 * for compatibility with Expo/Metro bundler without Babel plugins
 */
export class EventsStore {
  // Observable state (automatically inferred by makeAutoObservable)
  events: Event[] = [];
  loading: boolean = false;
  error: string | null = null;
  filters: EventFilters = {
    date: null,
    type: null,
    startDate: null,
    endDate: null,
  };
  metadata: PaginationMetadata | null = null;
  
  // ⭐ NUEVO: Estado para creación de eventos
  isCreating: boolean = false;
  createError: string | null = null;

  // ⭐ NUEVO: Estado para actualización de eventos
  isUpdating: boolean = false;
  updateError: string | null = null;

  // Service dependency
  private eventsService: EventsService;

  constructor(service: EventsService = eventsService) {
    this.eventsService = service;

    // Make properties observable automatically (no decorators needed)
    makeAutoObservable(this);
  }

  /**
   * Load events from API with current filters
   * Sets loading state, handles errors, and updates events
   */
  async loadEvents(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await this.eventsService.getEvents(this.filters);

      runInAction(() => {
        // ⭐ FIX CRÍTICO: Blindaje a prueba de fallos - SIEMPRE asignar array
        if (response.success && response.data) {
          // Garantizar que data sea un array, manejando posibles anidamientos
          const rawData = response.data as unknown;
          let eventsData: Event[];
          if (Array.isArray(rawData)) {
            eventsData = rawData;
          } else if (typeof rawData === 'object' && rawData !== null && 'data' in (rawData as Record<string, unknown>) && Array.isArray((rawData as Record<string, unknown>).data)) {
            eventsData = (rawData as Record<string, unknown>).data as Event[];
          } else {
            eventsData = [];
          }
          this.setEvents(eventsData);
          this.setMetadata(response.metadata);
        } else if (response.error) {
          // En caso de error, asignar array vacío para evitar undefined
          this.setEvents([]); // ⭐ GARANTÍA: Array vacío en error
          this.setError(response.error.message);
        } else {
          // Caso inesperado: asignar array vacío
          this.setEvents([]); // ⭐ GARANTÍA: Array vacío por defecto
        }
      });
    } catch (error: any) {
      runInAction(() => {
        // ⭐ FIX CRÍTICO: En catch, SIEMPRE asignar array vacío
        this.setEvents([]); // ⭐ GARANTÍA: Array vacío en excepción
        this.setError(error.message || 'Error al cargar eventos');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  /**
   * ⭐ NUEVO: Create a new event
   * @param payload - Event data (without id_program, extracted from JWT)
   * @returns Promise<boolean> - true if successful, false otherwise
   */
  async createEvent(payload: CreateEventPayload): Promise<boolean> {
    this.setIsCreating(true);
    this.setCreateError(null);

    // ⭐ DIAGNOSTIC: Log payload before sending
    

    try {
      const response = await this.eventsService.createEvent(payload);

      runInAction(() => {
        if (response.success && response.data) {
          // Evento creado exitosamente
          this.setIsCreating(false);
          
          // Re-fetch automático para actualizar la lista
          this.loadEvents();
          
          return true;
        } else if (response.error) {
          this.setCreateError(response.error.message);
          this.setIsCreating(false);
          return false;
        }
      });

      return true;
    } catch (error: any) {
      // ⭐ DIAGNOSTIC: Log error details
      console.error('❌ [EventsStore] Create event error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      runInAction(() => {
        this.setCreateError(error.message || 'Error al crear el evento');
        this.setIsCreating(false);
      });
      return false;
    }
  }

  /**
   * ⭐ NUEVO: Update an existing event
   * @param id - Event ID (number)
   * @param payload - Event data to update
   * @returns Promise<boolean> - true if successful, false otherwise
   */
  async updateEvent(id: number, payload: UpdateEventPayload): Promise<boolean> {
    this.setIsUpdating(true);
    this.setUpdateError(null);

    // ⭐ DIAGNOSTIC: Log payload before sending
    

    try {
      const response = await this.eventsService.updateEvent(id, payload);

      runInAction(() => {
        if (response.success && response.data) {
          // Evento actualizado exitosamente
          this.setIsUpdating(false);
          
          // Re-fetch automático para actualizar la lista
          this.loadEvents();
          
          return true;
        } else if (response.error) {
          this.setUpdateError(response.error.message);
          this.setIsUpdating(false);
          return false;
        }
      });

      return true;
    } catch (error: any) {
      // ⭐ DIAGNOSTIC: Log error details
      console.error('❌ [EventsStore] Update event error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      runInAction(() => {
        this.setUpdateError(error.message || 'Error al actualizar el evento');
        this.setIsUpdating(false);
      });
      return false;
    }
  }

  /**
   * ⭐ NUEVO: Delete an event (only owner or superadmin)
   * @param id_event - Event ID (number)
   * @returns Promise<void>
   */
  async deleteEvent(id_event: number): Promise<void> {
    try {
      const deleted = await this.eventsService.deleteEvent(id_event);

      if (deleted) {
        runInAction(() => {
          // Filtrar el evento eliminado del estado local
          this.events = this.events.filter(
            (e: Event) => e.id_event !== id_event
          );
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error desconocido al eliminar evento';

      console.error('[EventsStore] Error deleting event:', errorMessage);
      throw error; // Re-throw para que UI pueda manejarlo
    }
  }

  /**
   * Set a specific filter and reload events
   * @param filterType - Type of filter (date, type, startDate, endDate)
   * @param value - Filter value
   */
  setFilter(filterType: keyof EventFilters, value: any): void {
    this.filters[filterType] = value;
    this.loadEvents();
  }

  /**
   * Clear all filters and reload events
   */
  clearFilters(): void {
    this.filters = {
      date: null,
      type: null,
      startDate: null,
      endDate: null,
    };
    this.loadEvents();
  }

  /**
   * ⭐ NUEVO: Clear create error
   */
  clearCreateError(): void {
    this.createError = null;
  }

  /**
   * ⭐ NUEVO: Clear update error
   */
  clearUpdateError(): void {
    this.updateError = null;
  }

  /**
   * Update events array
   * @private
   */
  private setEvents(events: Event[]): void {
    this.events = events;
  }

  /**
   * Update loading state
   * @private
   */
  private setLoading(loading: boolean): void {
    this.loading = loading;
  }

  /**
   * Update error state
   * @private
   */
  private setError(error: string | null): void {
    this.error = error;
  }

  /**
   * Update metadata
   * @private
   */
  private setMetadata(metadata: PaginationMetadata): void {
    this.metadata = metadata;
  }

  /**
   * ⭐ NUEVO: Update isCreating state
   * @private
   */
  private setIsCreating(isCreating: boolean): void {
    this.isCreating = isCreating;
  }

  /**
   * ⭐ NUEVO: Update createError state
   * @private
   */
  private setCreateError(error: string | null): void {
    this.createError = error;
  }

  /**
   * ⭐ NUEVO: Update isUpdating state
   * @private
   */
  private setIsUpdating(isUpdating: boolean): void {
    this.isUpdating = isUpdating;
  }

  /**
   * ⭐ NUEVO: Update updateError state
   * @private
   */
  private setUpdateError(error: string | null): void {
    this.updateError = error;
  }

  /**
   * ⭐ NUEVO: Computed - Get upcoming events (future events only)
   */
  get upcomingEvents(): Event[] {
    const now = new Date();
    return this.events.filter(event => new Date(event.date) >= now);
  }
}

// Export singleton instance
export const eventsStore = new EventsStore();
