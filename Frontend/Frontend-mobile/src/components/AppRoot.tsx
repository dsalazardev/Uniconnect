import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppInitialization, useTokenRefresh, authStore } from '@/src/features/auth';
import { useInitNotifications } from '@/src/features/notifications/hooks/useInitNotifications';
import { useRealtimeNotifications } from '@/src/features/notifications/hooks/useRealtimeNotifications';
import { useRegisterPushToken } from '@/src/features/notifications/hooks/useNotifications';
import { useRouter } from 'expo-router';

interface AppRootProps {
  children: React.ReactNode;
}

export const AppRoot: React.FC<AppRootProps> = ({ children }) => {
  const { isInitializing, initializationError } = useAppInitialization();
  const router = useRouter();
  
  useTokenRefresh();
  useInitNotifications();
  useRealtimeNotifications();
  useRegisterPushToken(authStore.accessToken ?? '');

  const handleForceReset = () => {
    
    authStore.clearAuth();
    setTimeout(() => {
      router.replace('/(auth)/login');
    }, 100);
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D9B97E" />
        <Text style={styles.loadingText}>Inicializando aplicación...</Text>
      </View>
    );
  }

  if (initializationError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error de Inicialización</Text>
        <Text style={styles.errorMessage}>{initializationError}</Text>
        <Text style={styles.errorHint}>
          Por favor, reinicia la aplicación o contacta soporte técnico.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleForceReset}
        >
          <Text style={styles.retryButtonText}>Reiniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#363636',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#aaa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#363636',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4d4d',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#D9B97E',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});