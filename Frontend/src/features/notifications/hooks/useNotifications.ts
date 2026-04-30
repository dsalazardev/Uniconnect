import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { notificationsService } from '../services/notifications.service';
import { PushTokenPayload } from '../types';

export function useRegisterPushToken(authToken: string) {
  useEffect(() => {
    if (!authToken) return;

    async function register() {
      try {
        if (!Device.isDevice) return;

        // Pedir permisos de notificaciones
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        // Obtener token Expo Push
        const expoToken = (await Notifications.getExpoPushTokenAsync()).data;

        const payload: PushTokenPayload = {
          token: expoToken,
          device_type: Device.osName as string,
          device_name: 'Mi dispositivo',
        };

        // Llamar al servicio centralizado
        await notificationsService.registerExpoPushToken(payload);
      } catch (error) {
        // Defensive: Firebase/Expo notifications may not be initialized
        console.warn('[Push Notifications] Registration failed:', error instanceof Error ? error.message : String(error));
        // Continue without push notifications - app should not crash
      }
    }

    register();
  }, [authToken]);
}