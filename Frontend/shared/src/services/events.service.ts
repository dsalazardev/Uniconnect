/**
 * EventsService - BFF (Backend for Frontend) layer with Dependency Injection
 * 
 * Handles HTTP communication with the backend API using injected Axios instance.
 * Validates FEN response format and handles errors.
 * 
 * This service is platform-agnostic and uses dependency injection to avoid
 * coupling with specific HTTP clients or state management libraries.
 */

import type { AxiosInstance } from 'axios';
import type {
  Event,
  EventFilters,
  CreateEventPayload,
  UpdateEventPayload,
} from '../types/events';
import type { FENResponse, PaginationParams } from '../types/common';
import { EVENTS_ENDPOINTS } from '../api/endpoints';

export class EventsService {
  private readonly api: AxiosInstance;

  /**
   * Constructor with Dependency Injection
   * @param axiosInstance - Configured Axios instance (injected)
   */
  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  /**
   * Get events with optional filters and pagination
   * @param filters - Optional filters (date, type, startDate, endDate)
   * @param pagination - Pagination parameters (page, pageSize)
   * @returns Promise with FEN formatted response containing events array
   */
  async getEvents(
    filters: EventFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<FENResponse<Event[]>> {
    try {
      const params = this.buildQueryParams(filters, pagination);
      const response = await this.api.get(EVENTS_ENDPOINTS.GET_EVENTS, { params });

      const responseData = response.data;

      if (!responseData || !responseData.data) {
        return {
          success: true,
          data: [],
          error: null,
          metadata: {
            total: 0,
            page: pagination.page,
            pageSize: pagination.pageSize,
            hasNextPage: false,
            hasPreviousPage: false,
            timestamp: new Date().toISOString(),
          },
        };
      }

      if (!Array.isArray(responseData.data)) {
        responseData.data = [];
      }

      return this.validateFENResponse<Event[]>(responseData);
    } catch (error: unknown) {
      this.logError(error, 'getEvents', { filters, pagination });

      const axiosError = error as { code?: string; message?: string; response?: { data?: unknown } };

      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        return this.createErrorResponse<Event[]>(
          'TIMEOUT',
          'Error de conexión. La solicitud ha excedido el tiempo de espera.',
          pagination
        );
      }

      if (!axiosError.response) {
        return this.createErrorResponse<Event[]>(
          'NETWORK_ERROR',
          'Error de conexión. Verifica tu conexión a internet.',
          pagination
        );
      }

      if (axiosError.response?.data) {
        const errorResponse = axiosError.response.data as Record<string, unknown>;

        if (this.isFENFormat(errorResponse)) {
          if (!Array.isArray(errorResponse.data)) {
            errorResponse.data = [];
          }
          return this.validateFENResponse<Event[]>(errorResponse);
        }

        return this.createErrorResponse<Event[]>(
          'API_ERROR',
          (errorResponse.message as string) || 'Error al obtener eventos',
          pagination
        );
      }

      return this.createErrorResponse<Event[]>(
        'UNKNOWN_ERROR',
        'Error inesperado al obtener eventos',
        pagination
      );
    }
  }

  /**
   * Get a single event by ID
   * @param id_event - Event ID
   * @returns Promise with FEN formatted response containing event
   */
  async getEventById(id_event: number): Promise<FENResponse<Event>> {
    try {
      const response = await this.api.get(EVENTS_ENDPOINTS.GET_EVENT_BY_ID(id_event));
      return this.validateFENResponse<Event>(response.data);
    } catch (error: unknown) {
      this.logError(error, 'getEventById', { id_event });

      const axiosError = error as { code?: string; message?: string; response?: { status?: number; data?: unknown } };

      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        throw new Error('Error de conexión. La solicitud ha excedido el tiempo de espera.');
      }

      if (!axiosError.response) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }

      if (axiosError.response?.data) {
        const errorResponse = axiosError.response.data as Record<string, unknown>;

        if (this.isFENFormat(errorResponse)) {
          return this.validateFENResponse<Event>(errorResponse);
        }

        if (axiosError.response.status === 404) {
          throw new Error('Evento no encontrado');
        }

        throw new Error((errorResponse.message as string) || 'Error al obtener el evento');
      }

      throw new Error('Error inesperado al obtener el evento');
    }
  }

  /**
   * Create a new event
   * @param payload - Event data (without id_program, extracted from JWT)
   * @returns Promise with FEN formatted response containing created event
   */
  async createEvent(payload: CreateEventPayload): Promise<FENResponse<Event>> {
    try {
      const response = await this.api.post(EVENTS_ENDPOINTS.CREATE_EVENT, payload);
      return this.validateFENResponse<Event>(response.data);
    } catch (error: unknown) {
      this.logError(error, 'createEvent', { payload });

      const axiosError = error as { code?: string; message?: string; response?: { data?: unknown } };

      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        throw new Error('Error de conexión. La solicitud ha excedido el tiempo de espera.');
      }

      if (!axiosError.response) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }

      if (axiosError.response?.data) {
        const errorResponse = axiosError.response.data as Record<string, unknown>;

        if (this.isFENFormat(errorResponse)) {
          return this.validateFENResponse<Event>(errorResponse);
        }

        throw new Error((errorResponse.message as string) || 'Error al crear el evento');
      }

      throw new Error('Error inesperado al crear el evento');
    }
  }

  /**
   * Update an existing event
   * @param id - Event ID
   * @param payload - Event data to update
   * @returns Promise with FEN formatted response containing updated event
   */
  async updateEvent(id: number, payload: UpdateEventPayload): Promise<FENResponse<Event>> {
    try {
      const response = await this.api.put(EVENTS_ENDPOINTS.UPDATE_EVENT(id), payload);
      return this.validateFENResponse<Event>(response.data);
    } catch (error: unknown) {
      this.logError(error, 'updateEvent', { id, payload });

      const axiosError = error as { code?: string; message?: string; response?: { data?: unknown } };

      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        throw new Error('Error de conexión. La solicitud ha excedido el tiempo de espera.');
      }

      if (!axiosError.response) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }

      if (axiosError.response?.data) {
        const errorResponse = axiosError.response.data as Record<string, unknown>;

        if (this.isFENFormat(errorResponse)) {
          return this.validateFENResponse<Event>(errorResponse);
        }

        throw new Error((errorResponse.message as string) || 'Error al actualizar el evento');
      }

      throw new Error('Error inesperado al actualizar el evento');
    }
  }

  /**
   * Delete an event (only owner or superadmin)
   * @param id_event - Event ID
   * @returns Promise<boolean> - true if deleted successfully
   */
  async deleteEvent(id_event: number): Promise<boolean> {
    try {
      const response = await this.api.delete<FENResponse<{ deleted: boolean }>>(
        EVENTS_ENDPOINTS.DELETE_EVENT(id_event)
      );

      const validatedResponse = this.validateFENResponse<{ deleted: boolean }>(response.data, true);

      if (!validatedResponse.success || !validatedResponse.data?.deleted) {
        throw new Error(validatedResponse.error?.message || 'Error al eliminar evento');
      }

      return true;
    } catch (error: unknown) {
      this.logError(error, 'deleteEvent', { id_event });

      const axiosError = error as { code?: string; message?: string; response?: { data?: unknown } };

      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        throw new Error('Error de conexión. La solicitud ha excedido el tiempo de espera.');
      }

      if (axiosError.response?.data) {
        const errorResponse = axiosError.response.data as Record<string, unknown>;
        if (this.isFENFormat(errorResponse)) {
          throw new Error((errorResponse.error as { message?: string })?.message || 'Error al eliminar evento');
        }
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('No se pudo eliminar el evento');
    }
  }

  /**
   * Build query parameters from filters and pagination
   * @private
   */
  private buildQueryParams(
    filters: EventFilters,
    pagination: PaginationParams
  ): Record<string, string | number> {
    const params: Record<string, string | number> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    };

    if (filters.date) params.date = filters.date;
    if (filters.type) params.type = filters.type;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    return params;
  }

  /**
   * Create error response in FEN format
   * @private
   */
  private createErrorResponse<T>(
    code: string,
    message: string,
    pagination: PaginationParams
  ): FENResponse<T> {
    return {
      success: false,
      data: [] as unknown as T,
      error: { code, message },
      metadata: {
        total: 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Validate FEN response with configurable strictness
   * @private
   */
  private validateFENResponse<T>(response: unknown, skipStrictValidation: boolean = false): FENResponse<T> {
    if (!this.isFENFormat(response)) {
      throw new Error('Respuesta del servidor en formato inválido');
    }

    const fenResponse = response as FENResponse<T>;

    if (typeof fenResponse.success !== 'boolean') {
      throw new Error('Respuesta del servidor en formato inválido: campo success inválido');
    }

    if (!fenResponse.metadata || typeof fenResponse.metadata !== 'object') {
      throw new Error('Respuesta del servidor en formato inválido: metadata faltante');
    }

    const metadata = fenResponse.metadata;
    if (
      typeof metadata.total !== 'number' ||
      typeof metadata.page !== 'number' ||
      typeof metadata.pageSize !== 'number' ||
      typeof metadata.hasNextPage !== 'boolean' ||
      typeof metadata.hasPreviousPage !== 'boolean'
    ) {
      throw new Error('Respuesta del servidor en formato inválido: metadata incompleta');
    }

    if (fenResponse.success) {
      if (!skipStrictValidation) {
        if (Array.isArray(fenResponse.data)) {
          (fenResponse.data as Event[]).forEach((event, index) => {
            const requiredFields = ['id_event', 'title', 'description', 'date', 'time', 'location', 'type', 'createdAt', 'updatedAt'];
            for (const field of requiredFields) {
              if (!(field in event)) {
                throw new Error(`Respuesta del servidor en formato inválido: evento ${index} falta campo ${field}`);
              }
            }
          });
        } else if (fenResponse.data && typeof fenResponse.data === 'object') {
          const requiredFields = ['id_event', 'title', 'description', 'date', 'time', 'location', 'type', 'createdAt', 'updatedAt'];
          for (const field of requiredFields) {
            if (!(field in (fenResponse.data as Record<string, unknown>))) {
              throw new Error(`Respuesta del servidor en formato inválido: falta campo ${field}`);
            }
          }
        }
      }

      if (fenResponse.error !== null) {
        throw new Error('Respuesta del servidor en formato inválido: error debe ser null cuando success es true');
      }
    } else {
      if (!fenResponse.error || typeof fenResponse.error !== 'object') {
        throw new Error('Respuesta del servidor en formato inválido: error faltante');
      }

      if (!fenResponse.error.code || !fenResponse.error.message) {
        throw new Error('Respuesta del servidor en formato inválido: error incompleto');
      }

      if (fenResponse.data !== null && !(Array.isArray(fenResponse.data) && fenResponse.data.length === 0)) {
        throw new Error('Respuesta del servidor en formato inválido: data debe ser null o [] cuando success es false');
      }
    }

    return fenResponse;
  }

  /**
   * Check if response has basic FEN structure
   * @private
   */
  private isFENFormat(response: unknown): boolean {
    return (
      response !== null &&
      response !== undefined &&
      typeof response === 'object' &&
      'success' in response &&
      'data' in response &&
      'error' in response &&
      'metadata' in response
    );
  }

  /**
   * Log error with context information
   * @private
   */
  private logError(error: unknown, method: string, context: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const errorObj = error as { name?: string; message?: string; stack?: string; response?: { status?: number; statusText?: string; data?: unknown } };
    const errorType = errorObj.name || 'Error';
    const errorMessage = errorObj.message || 'Unknown error';

    console.error('[EventsService Error]', {
      timestamp,
      method,
      errorType,
      message: errorMessage,
      context,
      stack: errorObj.stack,
      response: errorObj.response
        ? {
            status: errorObj.response.status,
            statusText: errorObj.response.statusText,
            data: errorObj.response.data,
          }
        : undefined,
    });
  }
}
