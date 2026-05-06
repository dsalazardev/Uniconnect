import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonProps } from './Button';

export interface AuthButtonProps extends Omit<ButtonProps, 'title' | 'variant'> {
  authType: 'auth0'| 'logout';
  customTitle?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  authType,
  customTitle,
  style,
  textStyle,
  ...buttonProps
}) => {
  const getAuthConfig = () => {
    switch (authType) {
      case 'auth0':
        return {
          title: customTitle || 'Ingresar con Google',
          variant: 'primary' as const,
          style: StyleSheet.flatten([styles.auth0Button, style]),
          textStyle: StyleSheet.flatten([styles.auth0Text, textStyle]),
          icon: <Ionicons name="logo-google" size={22} color="#1a1a1a" style={styles.googleIcon} />
        };
      case 'logout':
        return {
          title: customTitle || 'Cerrar Sesión',
          variant: 'outline' as const,
          style: StyleSheet.flatten([styles.logoutButton, style]),
          textStyle: StyleSheet.flatten([styles.logoutText, textStyle]),
        };
      default:
        return {
          title: customTitle || 'Autenticar',
          variant: 'primary' as const,
          style: style,
          textStyle: textStyle,
        };
    }
  };

  const config = getAuthConfig();

  return (
    <Button
      {...buttonProps}
      title={config.title}
      variant={config.variant}
      style={config.style}
      textStyle={config.textStyle}
      icon={config.icon}
    />
  );
};

const styles = StyleSheet.create({
  auth0Button: {
    backgroundColor: '#D9B97E',
    borderColor: '#D9B97E',
    shadowColor: '#D9B97E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 12,
  },
  auth0Text: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  iconSpacing: {
    marginRight: 8,
  },
  googleIcon: {
    marginRight: 8,
  },
  googleButton: {
    backgroundColor: '#4285f4',
    borderColor: '#4285f4',
  },
  googleText: {
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  logoutText: {
    color: '#ffffff',
  },
});