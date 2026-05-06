import React, { useMemo, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useJoinRequest } from '../hooks/useJoinRequest';
import { GroupInfo } from '../types';
import { ConfirmModal } from '@/src/components/ConfirmModal';

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
  const [requestSent, setRequestSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determinar el estado del botón
  const buttonState = useMemo(() => {
    if (!groupInfo) {
      return { label: 'Solicitar acceso', icon: 'add-circle-outline', enabled: true };
    }

    if (groupInfo.isMember) {
      return { label: 'Eres miembro', icon: 'checkmark-circle', enabled: false };
    }

    // Exclusión mutua: si hay invitación activa, no se puede solicitar unirse
    if (groupInfo.hasActiveInvitation) {
      return {
        label: 'Invitación pendiente',
        icon: 'mail-outline',
        enabled: false,
        hint: 'Tienes una invitación pendiente. Acéptala o recházala primero.',
      };
    }

    // Solicitud ya enviada (viene del backend o del estado local)
    if (groupInfo.hasPendingRequest || requestSent) {
      return { label: 'Solicitud enviada', icon: 'time-outline', enabled: false };
    }

    return { label: 'Solicitar acceso', icon: 'add-circle-outline', enabled: true };
  }, [groupInfo, requestSent]);

  const handlePress = () => {
    setShowConfirm(true);
  };

  const doJoin = async () => {
    setShowConfirm(false);
    try {
      await joinMutation.mutateAsync(groupId);
      setRequestSent(true);
      onSuccess?.();
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data
              ?.message || 'Error al solicitar acceso'
          : 'Error al solicitar acceso';

      // Si el error indica que ya existe solicitud o ya es miembro, marcar como enviada
      if (
        typeof msg === 'string' &&
        (msg.toLowerCase().includes('pendiente') ||
          msg.toLowerCase().includes('ya eres miembro') ||
          msg.toLowerCase().includes('already'))
      ) {
        setRequestSent(true);
      } else {
        setErrorMessage(msg);
      }
    }
  };

  const isLoading = joinMutation.isPending;
  const isDisabled = disabled || !buttonState.enabled || isLoading;

  return (
    <>
      <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.7}
        accessibilityLabel={buttonState.label}
        accessibilityHint={'hint' in buttonState ? buttonState.hint : undefined}
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

      {/* Confirmación antes de enviar la solicitud */}
      <ConfirmModal
        visible={showConfirm}
        title="Solicitar acceso"
        message="¿Enviar solicitud de acceso al grupo? El owner deberá aceptarla."
        confirmText="Enviar solicitud"
        onConfirm={doJoin}
        onCancel={() => setShowConfirm(false)}
        webFallback
      />

      {/* Error al enviar solicitud */}
      <ConfirmModal
        visible={!!errorMessage}
        title="Error"
        message={errorMessage ?? ''}
        confirmText="Entendido"
        onConfirm={() => setErrorMessage(null)}
        onCancel={() => setErrorMessage(null)}
        webFallback
      />
    </>
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
