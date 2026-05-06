// Service instantiation with mobile Axios instance
import { NotificationsService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

// Instantiate service with mobile Axios instance
export const notificationsService = new NotificationsService(api);

// Re-export notification observer
export { notificationObserver } from './notification-observer.service';
