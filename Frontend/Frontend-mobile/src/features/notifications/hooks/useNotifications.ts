import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationsService } from '../services';
import { PushTokenPayload } from '../types';

export function useRegisterPushToken(authToken: string) {
  useEffect(() => {
    if (!authToken) return;

    // Determine whether push is enabled via env (EXPO_PUBLIC_ENABLE_PUSH) or expo constants
    const isPushEnabled = (() => {
      try {
        const envVal = typeof process !== 'undefined' && (process as any).env && (process as any).env.EXPO_PUBLIC_ENABLE_PUSH;
        if (typeof envVal === 'string') return envVal.toLowerCase() === 'true';
      } catch (e) {
        // ignore
      }

      // Fallback to expo constants if present
      try {
        const extra = (Constants?.expoConfig?.extra ?? (Constants as any).manifest?.extra) as any;
        if (extra && typeof extra.enablePush !== 'undefined') {
          if (typeof extra.enablePush === 'boolean') return extra.enablePush;
          if (typeof extra.enablePush === 'string') return extra.enablePush.toLowerCase() === 'true';
        }
      } catch (e) {
        // ignore
      }

      // Default: enabled
      return true;
    })();

    if (!isPushEnabled) return;

    async function register() {
      try {
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

        // Obtener token Expo Push (this may throw if native FCM is misconfigured)
        const tokenResult = await Notifications.getExpoPushTokenAsync();
        const expoToken = tokenResult?.data;

        if (!expoToken) return;

        const payload: PushTokenPayload = {
          token: expoToken,
          device_type: Device.osName as string,
          device_name: 'Mi dispositivo',
        };

        // Llamar al servicio centralizado
        await notificationsService.registerExpoPushToken(payload);
      } catch (error) {
        // Fail-safe: never throw from push registration. Log a developer-friendly warning.
        if (__DEV__) {
          console.warn(
            'Push registration skipped: ensure FCM is configured for Android or set EXPO_PUBLIC_ENABLE_PUSH=false. See https://docs.expo.dev/push-notifications/fcm-credentials/',
            error,
          );
        }
      }
    }

    register();
  }, [authToken]);
}
