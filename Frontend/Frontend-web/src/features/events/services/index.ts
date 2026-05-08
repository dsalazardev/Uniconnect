import { EventsService } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const eventsService = new EventsService(api);
