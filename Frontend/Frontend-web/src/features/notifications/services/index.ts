import { NotificationsService, notificationObserver } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const notificationsService = new NotificationsService(api);

export { notificationObserver };
