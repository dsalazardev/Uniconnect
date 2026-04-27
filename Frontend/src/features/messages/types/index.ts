export interface MessageFile {
  id_file: number;
  url: string;
  file_name: string;
  mime_type: string;
  size: number;
  created_at?: string;
}

export interface Message {
  id_message: number;
  id_membership: number;
  text_content: string;
  send_at: string;
  attachments: string;
  is_edited: boolean;
  edited_at: string | null;
  files?: MessageFile[];
  sender_name?: string;
  sender_picture?: string | null;
  membership?: {
    user: {
      id_user: number;
      full_name: string;
      picture?: string;
    };
    group: {
      id_group: number;
      name: string;
    };
  };
}

export interface SendMessageDto {
  id_membership: number;
  text_content: string;
  attachments?: string;
}

export interface EditMessageDto {
  id_message: number;
  text_content: string;
}

export interface MessageHistoryResponse {
  messages: Message[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MessageSearchResponse {
  results: Message[];
  count: number;
}

export interface TypingIndicator {
  id_user: number;
  full_name: string;
  is_typing: boolean;
}

// Tipos adicionales para WebSocket

export interface MessageSendData {
  text_content: string;
  attachments?: string;
}

export interface MessageEditData {
  id_message: number;
  text_content: string;
}

export interface MessageDeleteData {
  id_message: number;
}

export interface TypingData {
  id_user: number;
  full_name: string;
  is_typing: boolean;
}

export interface MessagesHistoryData {
  page: number;
  limit: number;
}

export interface SearchMessagesData {
  query: string;
}

export interface AuthenticateData {
  id_user: number;
  id_group: number;
  id_membership?: number; // Opcional: el backend lo busca automáticamente
}

export interface SessionStatsResponse {
  totalSessions: number;
  uniqueUsers: number;
  activeGroups: number;
  serverTime: string;
}

// Tipos para servicios REST

export interface MessageEditRequest {
  text_content: string;
}

export interface MessageCount {
  count: number;
}
