import { MessagesService, PollService, ForumService } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const messagesService = new MessagesService(api);
export const pollService = new PollService(api);
export const forumService = new ForumService(api);
