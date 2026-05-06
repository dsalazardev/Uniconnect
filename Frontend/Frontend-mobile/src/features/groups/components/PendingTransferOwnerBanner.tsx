import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PendingTransferOwnerBannerProps {
  candidateName?: string;
}

export const PendingTransferOwnerBanner = ({ candidateName }: PendingTransferOwnerBannerProps) => {
  const bannerMessage = candidateName
    ? `La transferencia de administrador a ${candidateName} está pendiente. No puedes salir del grupo hasta que el candidato acepte o rechace la transferencia.`
    : 'La transferencia de administrador está pendiente. No puedes salir del grupo hasta que el candidato acepte o rechace la transferencia.';

  return (
    <View style={styles.banner}>
      <View style={styles.iconContainer}>
        <Ionicons name="time-outline" size={20} color="#F59E0B" />
      </View>
      <Text style={styles.bannerText}>{bannerMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 6,
    gap: 10,
  },
  iconContainer: {
    paddingTop: 2,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#F59E0B',
    fontWeight: '500',
  },
});
