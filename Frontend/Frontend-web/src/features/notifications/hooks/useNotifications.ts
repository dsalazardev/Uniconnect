import { useEffect } from 'react';
import { notificationsService } from '../services';
import type { PushTokenPayload } from '@uniconnect/shared';

export function useRegisterPushToken(authToken: string) {
  useEffect(() => {
    if (!authToken) return;

    async function register() {
      // Web push notifications require service worker and different API
      // TODO: Implement web push notifications with service worker
      console.log('Web push notifications not yet implemented');
      
      // For now, skip push token registration on web
      // In the future, use Web Push API with service worker
    }

    register();
  }, [authToken]);
}
