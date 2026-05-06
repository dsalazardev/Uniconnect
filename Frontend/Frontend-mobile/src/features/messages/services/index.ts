// Service instantiation with mobile Axios instance
import { MessagesService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

// Instantiate service with mobile Axios instance
export const messagesService = new MessagesService(api);
