import { notificationObserver } from '@uniconnect/shared';
import { api } from '@/constants/api';
import { WebNotificationsService } from './notifications.service';

export const notificationsService = new WebNotificationsService(api);

export { notificationObserver };
