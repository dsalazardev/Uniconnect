import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { notificationsService } from '../services';
import { PushTokenPayload } from '../types';

export function useRegisterPushToken(authToken: string) {
  useEffect(() => {
    if (!authToken) return;

    async function register() {
      if (Platform.OS === 'web') return;
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
    }

    register();
  }, [authToken]);
}