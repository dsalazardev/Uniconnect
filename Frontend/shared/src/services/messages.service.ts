/**
 * MessagesService - BFF (Backend for Frontend) layer with Dependency Injection
 * 
 * Handles HTTP communication with the backend API for messages.
 * Uses injected Axios instance for platform-agnostic HTTP calls.
 */

import type { AxiosInstance } from 'axios';
import type { Message, MessageEditRequest, MessageCount, MessageSearchResponse } from '../types/messages';
import { MESSAGES_ENDPOINTS } from '../api/endpoints';

export class MessagesService {
  private readonly api: AxiosInstance;

  /**
   * Constructor with Dependency Injection
   * @param axiosInstance - Configured Axios instance (injected)
   */
  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  /**
   * Get recent messages from a group
   * @param groupId - Group ID
   * @param limit - Number of messages to fetch (default: 50)
   * @param beforeId - Cursor: id_message of the oldest message already loaded (for pagination)
   * @param since - Unix timestamp (ms): fetch messages sent after this date (for reconnection sync)
   */
  async getRecentMessages(
    groupId: number,
    limit: number = 50,
    beforeId?: number,
    since?: number
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    try {
      const endpoint = MESSAGES_ENDPOINTS.GET_RECENT_MESSAGES(groupId, limit, beforeId, since);
      const response = await this.api.get(endpoint);
      return response.data;
    } catch (error: unknown) {
      const endpoint = MESSAGES_ENDPOINTS.GET_RECENT_MESSAGES(groupId, limit, beforeId, since);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[MessagesService] ❌ GET ${endpoint} - Error:`, errorMessage);
      throw error;
    }
  }

  /**
   * Search messages in a group
   */
  async searchMessages(groupId: number, query: string): Promise<MessageSearchResponse> {
    try {
      const response = await this.api.get(MESSAGES_ENDPOINTS.SEARCH_MESSAGES(groupId, query));
      return response.data;
    } catch (error) {
      console.error('Error al buscar mensajes:', error);
      throw error;
    }
  }

  /**
   * Count messages in a group
   */
  async countMessages(groupId: number): Promise<MessageCount> {
    try {
      const response = await this.api.get(MESSAGES_ENDPOINTS.COUNT_MESSAGES(groupId));
      return response.data;
    } catch (error) {
      console.error('Error al contar mensajes:', error);
      throw error;
    }
  }

  /**
   * Get last message from a group
   */
  async getLastMessage(groupId: number): Promise<Message | null> {
    try {
      const response = await this.api.get(MESSAGES_ENDPOINTS.GET_LAST_MESSAGE(groupId));
      return response.data;
    } catch (error) {
      console.error('Error al obtener último mensaje:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: number, data: MessageEditRequest): Promise<Message> {
    try {
      const response = await this.api.patch(MESSAGES_ENDPOINTS.EDIT_MESSAGE(messageId), data);
      return response.data;
    } catch (error) {
      console.error('Error al editar mensaje:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: number): Promise<void> {
    try {
      await this.api.delete(MESSAGES_ENDPOINTS.DELETE_MESSAGE(messageId));
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
      throw error;
    }
  }
}
