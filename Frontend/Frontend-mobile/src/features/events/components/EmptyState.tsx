import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * EmptyState - Pure component for empty list state
 * Shows message when no events are available
 * No business logic or network calls
 */
export const EmptyState: React.FC = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.title}>No hay eventos disponibles</Text>
      <Text style={styles.message}>
        No se encontraron eventos que coincidan con los criterios de búsqueda.
      </Text>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
