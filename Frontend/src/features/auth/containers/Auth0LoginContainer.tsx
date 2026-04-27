import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { AuthButton } from '@/src/components/elements';
import { useAuth0Login } from '../hooks/useAuth0Login';
import { authController } from '../controllers/AuthController';

export const Auth0LoginContainer: React.FC = observer(() => {
  const { promptAsync, switchAccount, isLoading, isReady } = useAuth0Login();
  
  // MobX observer handles reactive updates automatically
  const isAuthenticated = authController.isAuthenticated;
  const currentUser = authController.currentUser;
  const error = authController.error;

  // Business logic handlers
  const handleAuth0Login = () => {
    promptAsync();
  };

  const handleSwitchAccount = () => {
    switchAccount();
  };

  const handleLogout = () => {
    authController.logout();
  };

  // Authenticated state UI
  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcomeText}>
          Bienvenido, {currentUser?.full_name}
        </Text>
        <AuthButton
          authType="logout"
          onPress={handleLogout}
          disabled={isLoading}
        />
        <AuthButton
          authType="auth0"
          onPress={handleSwitchAccount}
          disabled={isLoading}
          customTitle="Cambiar de cuenta"
          style={styles.switchButton}
        />
      </View>
    );
  }

  // Unauthenticated state UI
  return (
    <View style={styles.container}>
      <AuthButton
        authType="auth0"
        onPress={handleAuth0Login}
        isLoading={isLoading}
        disabled={!isReady}
      />
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            ❌ {error}
          </Text>
        </View>
      )}
      
      <Text style={styles.infoText}>
        Solo cuenta institucional de la Universidad de Caldas
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeText: {
    color: '#333',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  switchButton: {
    marginTop: 12,
    opacity: 0.8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderLeftColor: '#d32f2f',
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 16,
    maxWidth: 300,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  infoText: {
    color: '#D9B97E',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 18,
  },
});