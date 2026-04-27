import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '../types';

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
}) => {
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'connection_request':
        return { name: 'person-add' as const, color: '#D9B97E' };
      case 'message':
        return { name: 'chatbubble' as const, color: '#10B981' };
      case 'group_invitation':
        return { name: 'mail' as const, color: '#3B82F6' };
      case 'group_invitation_accepted':
        return { name: 'checkmark-circle' as const, color: '#8B5CF6' };
      case 'user_joined_group':
        return { name: 'people' as const, color: '#F59E0B' };
      case 'group_join_request':
        return { name: 'person-add-outline' as const, color: '#F97316' };
      case 'group_join_request_accepted':
        return { name: 'checkmark-circle' as const, color: '#22C55E' };
      case 'group_join_request_rejected':
        return { name: 'close-circle' as const, color: '#EF4444' };
      default:
        return { name: 'notifications' as const, color: '#D9B97E' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  const icon = getIcon();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.is_read && styles.unread,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
        <Ionicons name={icon.name} size={24} color={icon.color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>
          {notification.message}
        </Text>
        <Text style={styles.date}>
          {formatDate(notification.created_at)}
        </Text>
      </View>

      {!notification.is_read && (
        <View style={styles.unreadBadge} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  unread: {
    backgroundColor: '#2a2a2a',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9B97E',
    marginLeft: 8,
  },
});
