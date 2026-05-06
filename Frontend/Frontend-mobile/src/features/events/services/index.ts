// Service instantiation with mobile Axios instance
import { EventsService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

// Instantiate service with mobile Axios instance
export const eventsService = new EventsService(api);
