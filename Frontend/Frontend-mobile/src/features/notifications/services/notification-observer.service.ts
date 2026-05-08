/**
 * Re-export NotificationObserverService from shared package
 *
 * The canonical implementation lives in @uniconnect/shared.
 * This file exists as a thin re-export for backward compatibility
 * with existing imports and the mobile features barrel.
 */
export {
  NotificationObserverService,
  notificationObserver,
} from '@uniconnect/shared';
