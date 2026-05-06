import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '@/src/features/auth';
import { AppRoot } from '@/src/components/AppRoot';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
// Solo aplica en nativo — en web no hay soporte de push nativo
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const queryClient = new QueryClient();

const RootNavigationWrapper = observer(() => {
  const [token, setToken] = useState(authStore.accessToken);
  const [needsOnboarding, setNeedsOnboarding] = useState(authStore.needsOnboarding);
  const segments = useSegments();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Ref para el listener de tap en notificaciones — evita duplicados
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);
  // Ref al router para que el listener siempre use la instancia actualizada
  const routerRef = useRef(router);

  // Mantener routerRef siempre actualizado
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  useEffect(() => {
    const disposer = reaction(
      () => ({ token: authStore.accessToken, needsOnboarding: authStore.needsOnboarding }),
      ({ token: nextToken, needsOnboarding: nextNeeds }) => {
        setToken(nextToken);
        setNeedsOnboarding(nextNeeds);
      },
      { fireImmediately: true }
    );

    return () => {
      disposer();
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    // Dar tiempo adicional para que el router se inicialice
    const timer = setTimeout(() => {
      setIsRouterReady(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted || !isRouterReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = inAuthGroup && (segments as string[])[1] === 'onboarding';

    try {
      // Solo navegar si realmente necesitamos cambiar de ruta
      if (!token && !inAuthGroup) {
        
        router.replace('/(auth)/login');
      } else if (token && needsOnboarding && !inOnboarding) {
        
        router.replace('/(auth)/onboarding');
      } else if (token && !needsOnboarding && inAuthGroup) {
        
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // No hacer nada si hay error, dejar que el router se estabilice
    }
  }, [token, needsOnboarding, segments, isMounted, isRouterReady, router]);

  useEffect(() => {
    async function getExpoToken() {
      if (Platform.OS === 'web') return;
      if (!Device.isDevice) {
        
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } =
          await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        
        return;
      }

      //const token = (await Notifications.getExpoPushTokenAsync()).data;

      //
    }

    getExpoToken();
  }, []);

  // Listener para cuando el usuario toca una notificación push (app en foreground/background)
  // y lectura de la última notificación pendiente (cold start / app cerrada)
  // Solo disponible en dispositivos nativos — no en web
  // Espera a isRouterReady para garantizar que el router puede navegar
  useEffect(() => {
    if (Platform.OS === 'web' || !isRouterReady) return;

    const handleNotificationData = (data: Record<string, unknown>) => {
      

      const screen = data?.screen as string | undefined;
      const params = data?.params as Record<string, unknown> | undefined;

      if (screen === 'GroupInfo' && params?.groupId) {
        const groupId = Number(params.groupId);
        const autoOpenAccept = params.autoOpenAccept === true;

        

        routerRef.current.push({
          pathname: '/groups/[id]',
          params: {
            id: String(groupId),
            autoOpenInfo: 'true',
            autoOpenAccept: String(autoOpenAccept),
          },
        } as any);
      }
    };

    // 1. Cold start: leer la notificación que abrió la app (si existe)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification?.request?.content?.data) {
        handleNotificationData(
          response.notification.request.content.data as Record<string, unknown>,
        );
      }
    });

    // 2. App en foreground/background: escuchar taps en tiempo real
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationData(
          response.notification.request.content.data as Record<string, unknown>,
        );
      });

    return () => {
      notificationResponseListener.current?.remove();
    };
  }, [isRouterReady]);

  return <Stack screenOptions={{ headerShown: false }} />;
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoot>
        <RootNavigationWrapper />
      </AppRoot>
    </QueryClientProvider>
  );
}