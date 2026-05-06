import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { authStore } from '@/src/features/auth';

export default function HomeScreen() {
  const user = authStore.user;
  const firstName = user?.full_name?.split(' ')[0] || 'Usuario';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>¡Hola, {firstName}! 👋</Text>
        <Text style={styles.subtitle}>Bienvenido a tu panel de UniConnect.</Text>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Tip: Usa el menú superior para navegar rápidamente entre secciones.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#363636', padding: 20 },
  welcomeSection: { marginBottom: 25, marginTop: 10 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#aaa' },
  statusCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#D9B97E',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    marginBottom: 20,
  },
  statusTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#fff' },
  statusText: { color: '#aaa' },
  infoBox: { padding: 15, backgroundColor: 'rgba(217, 185, 126, 0.2)', borderRadius: 10, borderWidth: 1, borderColor: '#D9B97E' },
  infoText: { color: '#D9B97E', fontSize: 13, textAlign: 'center', fontWeight: '600' }
});