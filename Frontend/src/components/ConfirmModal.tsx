import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** En web, usar window.confirm en lugar del modal (útil cuando está dentro de otro Modal) */
  webFallback?: boolean;
}

/**
 * Modal de confirmación cross-platform.
 * - Web: modal flotante centrado con overlay oscuro, estilo del proyecto
 * - Móvil: Alert.alert nativo del sistema operativo
 *
 * Uso:
 * <ConfirmModal
 *   visible={show}
 *   title="Sacar miembro"
 *   message="¿Sacar a Juan del grupo?"
 *   confirmText="Sacar"
 *   destructive
 *   onConfirm={handleRemove}
 *   onCancel={() => setShow(false)}
 * />
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
  webFallback = false,
}) => {
  // ── Móvil: delegar a Alert nativo ─────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web' && visible) {
      Alert.alert(title, message, [
        { text: cancelText, style: 'cancel', onPress: onCancel },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ]);
    }
  }, [visible]);

  // En móvil no renderizamos nada
  if (Platform.OS !== 'web') return null;

  // ── Web con webFallback: window.confirm (para uso dentro de otros Modals) ──
  useEffect(() => {
    if (Platform.OS === 'web' && webFallback && visible) {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      } else {
        onCancel();
      }
    }
  }, [visible]);

  if (Platform.OS === 'web' && webFallback) return null;

  // ── Web: modal personalizado ───────────────────────────────────────────────
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Mensaje */}
          <Text style={styles.message}>{message}</Text>

          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  cancelText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#D9B97E',
    alignItems: 'center',
  },
  confirmBtnDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  confirmText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmTextDestructive: {
    color: '#EF4444',
  },
});
