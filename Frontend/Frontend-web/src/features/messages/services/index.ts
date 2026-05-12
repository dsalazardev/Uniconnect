import { MessagesService, PollService } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const messagesService = new MessagesService(api);
export const pollService = new PollService(api);
