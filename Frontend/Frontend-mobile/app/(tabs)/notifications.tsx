import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NotificationsList } from '@/src/features/notifications/components/NotificationsList';

const NotificationsScreen = () => {
  return (
    <View style={styles.container}>
      <NotificationsList />
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});