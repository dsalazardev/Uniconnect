import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

/**
 * LoadingIndicator - Pure component for loading state
 * Shows spinner and loading message
 * No business logic or network calls
 */
export const LoadingIndicator: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0056b3" />
      <Text style={styles.text}>Cargando eventos...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
