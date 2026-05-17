import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PrivateChatHeaderProps {
  recipientName: string;
  recipientPicture?: string | null;
  isOnline: boolean;
}

export const PrivateChatHeader: React.FC<PrivateChatHeaderProps> = ({
  recipientName,
  recipientPicture,
  isOnline,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        {recipientPicture ? (
          <Image source={{ uri: recipientPicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color="#888" />
          </View>
        )}
        <View style={[styles.presenceDot, isOnline ? styles.online : styles.offline]} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{recipientName}</Text>
        <Text style={[styles.status, isOnline ? styles.statusOnline : styles.statusOffline]}>
          {isOnline ? 'En línea' : 'Desconectado'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  online: {
    backgroundColor: '#4caf50',
  },
  offline: {
    backgroundColor: '#666',
  },
  info: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  status: {
    fontSize: 11,
  },
  statusOnline: {
    color: '#4caf50',
  },
  statusOffline: {
    color: '#888',
  },
});
