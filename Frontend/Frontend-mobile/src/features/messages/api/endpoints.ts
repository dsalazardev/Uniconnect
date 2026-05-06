import { API_BASE_URL } from '@/src/constants/api';

export const messagesEndpoints = {
  // Obtener mensajes recientes de un grupo (con cursor para paginación infinita)
  getRecentMessages: (groupId: number, limit: number = 50, beforeId?: number) => {
    const base = `${API_BASE_URL}/messages/group/${groupId}/recent?limit=${limit}`;
    return beforeId ? `${base}&beforeId=${beforeId}` : base;
  },
  
  // Buscar mensajes en un grupo
  searchMessages: (groupId: number, query: string) =>
    `${API_BASE_URL}/messages/group/${groupId}/search?query=${encodeURIComponent(query)}`,
  
  // Contar mensajes de un grupo
  countMessages: (groupId: number) =>
    `${API_BASE_URL}/messages/group/${groupId}/count`,
  
  // Obtener último mensaje de un grupo
  getLastMessage: (groupId: number) =>
    `${API_BASE_URL}/messages/group/${groupId}/last`,
  
  // Editar mensaje
  editMessage: (messageId: number) =>
    `${API_BASE_URL}/messages/${messageId}/edit`,
  
  // Eliminar mensaje
  deleteMessage: (messageId: number) =>
    `${API_BASE_URL}/messages/${messageId}`,
};
