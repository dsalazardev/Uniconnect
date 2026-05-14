// Message types
import type { Poll } from './polls';

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
  poll?: Poll;
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
  id_membership?: number;
}

export interface SessionStatsResponse {
  totalSessions: number;
  uniqueUsers: number;
  activeGroups: number;
  serverTime: string;
}

export interface MessageEditRequest {
  text_content: string;
}

export interface MessageCount {
  count: number;
}

export interface ChatRoom {
  id_group: number;
  name: string;
  is_direct_message: boolean;
  last_message?: {
    text_content: string;
    send_at: string;
  };
}
