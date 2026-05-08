import { MessagesService } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const messagesService = new MessagesService(api);
