import axios from 'axios';
import { messagesEndpoints } from '../api/endpoints';
import { Message, MessageEditRequest, MessageCount, MessageSearchResponse } from '../types';

class MessagesService {
  /**
   * Obtener mensajes recientes de un grupo
   * @param beforeId cursor: id_message del mensaje más antiguo ya cargado (para paginación)
   */
  async getRecentMessages(
    groupId: number,
    limit: number = 50,
    token: string,
    beforeId?: number,
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    try {
      const endpoint = messagesEndpoints.getRecentMessages(groupId, limit, beforeId);
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      const endpoint = messagesEndpoints.getRecentMessages(groupId, limit, beforeId);
      console.error(`[MessagesService] ❌ GET ${endpoint} - Error:`, error.message);
      throw error;
    }
  }

  /**
   * Buscar mensajes en un grupo
   */
  async searchMessages(groupId: number, query: string, token: string): Promise<MessageSearchResponse> {
    try {
      const response = await axios.get(messagesEndpoints.searchMessages(groupId, query), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al buscar mensajes:', error);
      throw error;
    }
  }

  /**
   * Contar mensajes de un grupo
   */
  async countMessages(groupId: number, token: string): Promise<MessageCount> {
    try {
      const response = await axios.get(messagesEndpoints.countMessages(groupId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al contar mensajes:', error);
      throw error;
    }
  }

  /**
   * Obtener último mensaje de un grupo
   */
  async getLastMessage(groupId: number, token: string): Promise<Message | null> {
    try {
      const response = await axios.get(messagesEndpoints.getLastMessage(groupId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener último mensaje:', error);
      throw error;
    }
  }

  /**
   * Editar un mensaje
   */
  async editMessage(messageId: number, data: MessageEditRequest, token: string): Promise<Message> {
    try {
      const response = await axios.patch(messagesEndpoints.editMessage(messageId), data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al editar mensaje:', error);
      throw error;
    }
  }

  /**
   * Eliminar un mensaje
   */
  async deleteMessage(messageId: number, token: string): Promise<void> {
    try {
      await axios.delete(messagesEndpoints.deleteMessage(messageId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
      throw error;
    }
  }
}

export const messagesService = new MessagesService();
export default MessagesService;
