import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationsStore } from '../store/notifications.store';

interface NotificationIconProps {
  onPress: () => void;
  color?: string;
  size?: number;
}

export const NotificationIcon = ({
  onPress,
  color = '#fff',
  size = 28,
}: NotificationIconProps) => {
  const unreadCount = useNotificationsStore(
    (state) => state.unreadCount
  );

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Ionicons
        name="notifications-outline"
        size={size}
        color={color}
      />

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#D9B97E',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});