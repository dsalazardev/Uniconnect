import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useJoinRequest } from '../hooks/useJoinRequest';
import { GroupInfo } from '../types';

interface GroupJoinButtonProps {
  groupId: number;
  groupInfo?: GroupInfo;
  onSuccess?: () => void;
  disabled?: boolean;
}

export const GroupJoinButton = ({
  groupId,
  groupInfo,
  onSuccess,
  disabled = false,
}: GroupJoinButtonProps) => {
  const joinMutation = useJoinRequest();

  // Determinar el estado del botón
  const buttonState = useMemo(() => {
    if (!groupInfo) {
      return { label: 'Solicitar acceso', icon: 'add-circle-outline', enabled: true };
    }

    if (groupInfo.isMember) {
      return { label: 'Eres miembro', icon: 'checkmark-circle', enabled: false };
    }

    if (groupInfo.userRole === 'none') {
      // Si no es miembro, podría haber un join request pendiente
      // Por ahora asumimos que si no es miembro, puede solicitar
      return { label: 'Solicitar acceso', icon: 'add-circle-outline', enabled: true };
    }

    return { label: 'Solicitar acceso', icon: 'add-circle-outline', enabled: true };
  }, [groupInfo]);

  const handlePress = async () => {
    try {
      await joinMutation.mutateAsync(groupId);
      Alert.alert('Éxito', 'Solicitud de acceso enviada al grupo.');
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al solicitar acceso'
        : 'Error al solicitar acceso';
      Alert.alert('Error', errorMessage);
    }
  };

  const isLoading = joinMutation.isPending;
  const isDisabled = disabled || !buttonState.enabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="small" color={isDisabled ? '#999' : '#D9B97E'} />
        ) : (
          <Ionicons
            name={buttonState.icon as any}
            size={18}
            color={isDisabled ? '#999' : '#D9B97E'}
          />
        )}
        <Text style={[styles.text, isDisabled && styles.textDisabled]}>
          {isLoading ? 'Enviando...' : buttonState.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(217, 185, 126, 0.15)',
    borderColor: '#D9B97E',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#D9B97E',
    fontSize: 14,
    fontWeight: '600',
  },
  textDisabled: {
    color: '#999',
  },
});
