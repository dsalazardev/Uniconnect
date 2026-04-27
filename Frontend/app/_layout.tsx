import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '@/src/features/auth';
import { AppRoot } from '@/src/components/AppRoot';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';

const queryClient = new QueryClient();

const RootNavigationWrapper = observer(() => {
  const [token, setToken] = useState(authStore.accessToken);
  const [needsOnboarding, setNeedsOnboarding] = useState(authStore.needsOnboarding);
  const segments = useSegments();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Subscribe to auth state changes using MobX
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
        console.log('No authenticated, redirecting to login...');
        router.replace('/(auth)/login');
      } else if (token && needsOnboarding && !inOnboarding) {
        console.log('Needs onboarding, redirecting...');
        router.replace('/(auth)/onboarding');
      } else if (token && !needsOnboarding && inAuthGroup) {
        console.log('Authenticated and onboarded, redirecting to tabs...');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // No hacer nada si hay error, dejar que el router se estabilice
    }
  }, [token, needsOnboarding, segments, isMounted, isRouterReady, router]);

  useEffect(() => {
    async function getExpoToken() {
      if (!Device.isDevice) {
        console.log('Usa un dispositivo físico');
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
        console.log("Permiso denegado");
        return;
      }

      //const token = (await Notifications.getExpoPushTokenAsync()).data;

      //console.log('EXPO PUSH TOKEN:', token);
    }

    getExpoToken();
  }, []);

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