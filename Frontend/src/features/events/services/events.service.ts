import { api } from '@/src/constants/api';
import { EVENTS_ENDPOINTS } from '../api/endpoints';
import {
  Event,
  EventFilters,
  PaginationParams,
  FENResponse,
  ErrorDetails,
  CreateEventPayload, // ⭐ NUEVO
  UpdateEventPayload, // ⭐ NUEVO
} from '../types/event.types';

/**
 * EventsService - BFF (Backend for Frontend) layer
 * Handles HTTP communication with the backend API using Axios
 * Validates FEN response format and handles errors
 */
export class EventsService {
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
      // Build query parameters
      const params = this.buildQueryParams(filters, pagination);

      // Make HTTP GET request
      const response = await api.get(EVENTS_ENDPOINTS.GET_EVENTS, { params });

      // ⭐ FIX CRÍTICO: Blindaje a prueba de fallos - garantizar array
      const responseData = response.data;
      
      // Si la respuesta no tiene data o es null/undefined, crear estructura FEN con array vacío
      if (!responseData || !responseData.data) {
        return {
          success: true,
          data: [], // ⭐ GARANTÍA: Siempre array vacío si no hay data
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

      // Si data no es un array, convertirlo a array vacío
      if (!Array.isArray(responseData.data)) {
        responseData.data = [];
      }

      // Validate FEN response format
      const validatedResponse = this.validateFENResponse<Event[]>(responseData);

      return validatedResponse;
    } catch (error: any) {
      // Log error with context
      this.logError(error, 'getEvents', { filters, pagination });

      // ⭐ FIX CRÍTICO: En caso de error, retornar estructura FEN con array vacío
      // NUNCA lanzar excepción que cause undefined en el store
      
      // Handle network errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          data: [], // ⭐ GARANTÍA: Array vacío en error
          error: {
            code: 'TIMEOUT',
            message: 'Error de conexión. La solicitud ha excedido el tiempo de espera.',
          },
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

      if (!error.response) {
        return {
          success: false,
          data: [], // ⭐ GARANTÍA: Array vacío en error
          error: {
            code: 'NETWORK_ERROR',
            message: 'Error de conexión. Verifica tu conexión a internet.',
          },
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

      // Handle HTTP errors with FEN format
      if (error.response?.data) {
        const errorResponse = error.response.data;

        // If backend returns FEN format error, validate and return it
        if (this.isFENFormat(errorResponse)) {
          // ⭐ GARANTÍA: Asegurar que data sea array incluso en error
          if (!Array.isArray(errorResponse.data)) {
            errorResponse.data = [];
          }
          return this.validateFENResponse<Event[]>(errorResponse);
        }

        // Otherwise, transform to FEN format
        return {
          success: false,
          data: [], // ⭐ GARANTÍA: Array vacío en error
          error: {
            code: 'API_ERROR',
            message: errorResponse.message || errorResponse.error?.message || 'Error al obtener eventos',
          },
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

      return {
        success: false,
        data: [], // ⭐ GARANTÍA: Array vacío en error
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Error inesperado al obtener eventos',
        },
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
  }

  /**
   * Get a single event by ID
   * @param id_event - Event ID
   * @returns Promise with FEN formatted response containing event
   */
  async getEventById(id_event: number): Promise<FENResponse<Event>> {
    try {
      // Make HTTP GET request
      const response = await api.get(EVENTS_ENDPOINTS.GET_EVENT_BY_ID(id_event));

      // Validate FEN response format
      const validatedResponse = this.validateFENResponse<Event>(response.data);

      return validatedResponse;
    } catch (error: any) {
      // Log error with context
      this.logError(error, 'getEventById', { id_event });

      // Handle network errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Error de conexión. La solicitud ha excedido el tiempo de espera.');
      }

      if (!error.response) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }

      // Handle HTTP errors
      if (error.response?.data) {
        const errorResponse = error.response.data;

        // If backend returns FEN format error, validate and return it
        if (this.isFENFormat(errorResponse)) {
          return this.validateFENResponse<Event>(errorResponse);
        }

        // Handle 404 specifically
        if (error.response.status === 404) {
          throw new Error('Evento no encontrado');
        }

        // Otherwise, extract error message
        throw new Error(
          errorResponse.message || 
          errorResponse.error?.message || 
          'Error al obtener el evento'
        );
      }

      throw new Error('Error inesperado al obtener el evento');
    }
  }

  /**
   * ⭐ NUEVO: Create a new event
   * @param payload - Event data (without id_program, extracted from JWT)
   * @returns Promise with FEN formatted response containing created event
   */
  async createEvent(payload: CreateEventPayload): Promise<FENResponse<Event>> {
    try {
      // Make HTTP POST request
      const response = await api.post(EVENTS_ENDPOINTS.CREATE_EVENT, payload);

      // Validate FEN response format
      const validatedResponse = this.validateFENResponse<Event>(response.data);

      return validatedResponse;
    } catch (error: any) {
      // Log error with context
      this.logError(error, 'createEvent', { payload });

      // Handle network errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Error de conexión. La solicitud ha excedido el tiempo de espera.');
      }

      if (!error.response) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }

      // Handle HTTP errors with FEN format
      if (error.response?.data) {
        const errorResponse = error.response.data;

        // If backend returns FEN format error, validate and return it
        if (this.isFENFormat(errorResponse)) {
          return this.validateFENResponse<Event>(errorResponse);
        }

        // Otherwise, extract error message
        throw new Error(
          errorResponse.message || 
          errorResponse.error?.message || 
          'Error al crear el evento'
        );
      }

      throw new Error('Error inesperado al crear el evento');
    }
  }

  /**
   * ⭐ NUEVO: Delete an event (only owner or superadmin)
   * @param id_event - Event ID
   * @returns Promise<boolean> - true if deleted successfully
   */
  async deleteEvent(id_event: number): Promise<boolean> {
    try {
      // Make HTTP DELETE request
      const response = await api.delete<FENResponse<{ deleted: boolean }>>(       EVENTS_ENDPOINTS.DELETE_EVENT(id_event)
      );

      // ⭐ FIX-11: Validate FEN response with relaxed validation
      // DELETE operations don't return full event data, only confirmation
      const validatedResponse = this.validateFENResponse<{ deleted: boolean }>(response.data, true);

      // Check if deletion was successful
      if (!validatedResponse.success || !validatedResponse.data?.deleted) {
        throw new Error(
          validatedResponse.error?.message || 'Error al eliminar evento'
        );
      }

      return true;
    } catch (error: unknown) {
      // Log error with context
      this.logError(error, 'deleteEvent', { id_event });

      // Handle network errors
      if (error && typeof error === 'object' && 'code' in error) {
        const axiosError = error as { code?: string; message?: string };
        if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
          throw new Error('Error de conexión. La solicitud ha excedido el tiempo de espera.');
        }
      }

      // Handle HTTP errors with FEN format
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: any } };
        if (axiosError.response?.data) {
          const errorResponse = axiosError.response.data;
          if (this.isFENFormat(errorResponse)) {
            throw new Error(
              errorResponse.error?.message || 'Error al eliminar evento'
            );
          }
        }
      }

      // Re-throw if already an Error instance
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('No se pudo eliminar el evento');
    }
  }

  /**
   * ⭐ NUEVO: Update an existing event
   * @param id - Event ID (number)
   * @param payload - Event data to update
   * @returns Promise with FEN formatted response containing updated event
   */
  async updateEvent(id: number, payload: UpdateEventPayload): Promise<FENResponse<Event>> {
    try {
      // Make HTTP PUT request
      const response = await api.put(EVENTS_ENDPOINTS.UPDATE_EVENT(id), payload);

      // Validate FEN response format
      const validatedResponse = this.validateFENResponse<Event>(response.data);

      return validatedResponse;
    } catch (error: any) {
      // Log error with context
      this.logError(error, 'updateEvent', { id, payload });

      // Handle network errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Error de conexión. La solicitud ha excedido el tiempo de espera.');
      }

      if (!error.response) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }

      // Handle HTTP errors with FEN format
      if (error.response?.data) {
        const errorResponse = error.response.data;

        // If backend returns FEN format error, validate and return it
        if (this.isFENFormat(errorResponse)) {
          return this.validateFENResponse<Event>(errorResponse);
        }

        // Otherwise, extract error message
        throw new Error(
          errorResponse.message || 
          errorResponse.error?.message || 
          'Error al actualizar el evento'
        );
      }

      throw new Error('Error inesperado al actualizar el evento');
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

    if (filters.date) {
      params.date = filters.date;
    }

    if (filters.type) {
      params.type = filters.type;
    }

    if (filters.startDate) {
      params.startDate = filters.startDate;
    }

    if (filters.endDate) {
      params.endDate = filters.endDate;
    }

    return params;
  }

  /**
   * Validate that response follows FEN format
   * @private
   */
  /**
   * ⭐ FIX-11: Validate FEN response with configurable strictness
   * @param response - The response to validate
   * @param skipStrictValidation - If true, skip strict field validation (for DELETE operations)
   */
  private validateFENResponse<T>(response: any, skipStrictValidation: boolean = false): FENResponse<T> {
    try {
      // Check if response has FEN structure
      if (!this.isFENFormat(response)) {
        throw new Error('Respuesta del servidor en formato inválido');
      }

      // Validate success field
      if (typeof response.success !== 'boolean') {
        throw new Error('Respuesta del servidor en formato inválido: campo success inválido');
      }

      // Validate metadata
      if (!response.metadata || typeof response.metadata !== 'object') {
        throw new Error('Respuesta del servidor en formato inválido: metadata faltante');
      }

      const metadata = response.metadata;
      if (
        typeof metadata.total !== 'number' ||
        typeof metadata.page !== 'number' ||
        typeof metadata.pageSize !== 'number' ||
        typeof metadata.hasNextPage !== 'boolean' ||
        typeof metadata.hasPreviousPage !== 'boolean'
      ) {
        throw new Error('Respuesta del servidor en formato inválido: metadata incompleta');
      }

      // If success is true, validate data (with configurable strictness)
      if (response.success) {
        // Skip field validation for operations like DELETE that don't return full entity data
        if (!skipStrictValidation) {
          // For array responses
          if (Array.isArray(response.data)) {
            // Validate each event has required fields
            response.data.forEach((event: any, index: number) => {
              const requiredFields = ['id_event', 'title', 'description', 'date', 'time', 'location', 'type', 'createdAt', 'updatedAt'];
              for (const field of requiredFields) {
                if (!(field in event)) {
                  throw new Error(
                    `Respuesta del servidor en formato inválido: evento ${index} falta campo ${field}`
                  );
                }
              }
            });
          }
          // For single object responses (create, update)
          else if (response.data && typeof response.data === 'object') {
            const requiredFields = ['id_event', 'title', 'description', 'date', 'time', 'location', 'type', 'createdAt', 'updatedAt'];
            for (const field of requiredFields) {
              if (!(field in response.data)) {
                throw new Error(
                  `Respuesta del servidor en formato inválido: falta campo ${field}`
                );
              }
            }
          }
        }

        if (response.error !== null) {
          throw new Error('Respuesta del servidor en formato inválido: error debe ser null cuando success es true');
        }
      } else {
        // If success is false, validate error
        if (!response.error || typeof response.error !== 'object') {
          throw new Error('Respuesta del servidor en formato inválido: error faltante');
        }

        if (!response.error.code || !response.error.message) {
          throw new Error('Respuesta del servidor en formato inválido: error incompleto');
        }

        // ⭐ FIX: Allow empty array [] in addition to null when success is false
        // This supports defensive programming where backend returns [] instead of null
        if (response.data !== null && !(Array.isArray(response.data) && response.data.length === 0)) {
          throw new Error('Respuesta del servidor en formato inválido: data debe ser null o [] cuando success es false');
        }
      }

      return response as FENResponse<T>;
    } catch (error: any) {
      // Log validation errors
      this.logError(error, 'validateFENResponse', { response });
      throw error;
    }
  }

  /**
   * Check if response has basic FEN structure
   * @private
   */
  private isFENFormat(response: any): boolean {
    return (
      response &&
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
  private logError(error: any, method: string, context: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const errorType = error.name || error.constructor?.name || 'Error';
    const errorMessage = error.message || 'Unknown error';
    
    console.error('[EventsService Error]', {
      timestamp,
      method,
      errorType,
      message: errorMessage,
      context,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : undefined,
    });
  }
}

// Export singleton instance
export const eventsService = new EventsService();
