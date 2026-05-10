import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { NotificationCanal } from '../types';
import { authStore } from '@/src/features/auth';

const CANAL_ICONS: Record<NotificationCanal, keyof typeof Ionicons.glyphMap> = {
  in_app_websocket: 'notifications-outline',
  email_institucional: 'mail-outline',
  push_movil: 'phone-portrait-outline',
  resumen_diario: 'calendar-outline',
};

export function NotificationPreferences() {
  const token = authStore.accessToken || '';
  const { preferences, loading, saving, error, updatePreference, reloadPreferences, CANALES, TIPOS_EVENTO } =
    useNotificationPreferences(token);

  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});

  const toggleExpand = (tipoEvento: string) => {
    setExpandedTypes((prev) => ({ ...prev, [tipoEvento]: !prev[tipoEvento] }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D9B97E" />
        <Text style={styles.loadingText}>Cargando preferencias...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={reloadPreferences}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>
          Configura por qué canales quieres recibir cada tipo de notificación.
        </Text>
        {saving && <ActivityIndicator size="small" color="#D9B97E" style={styles.savingIndicator} />}
      </View>

      {TIPOS_EVENTO.map((tipo) => {
        const isExpanded = expandedTypes[tipo.key] ?? false;
        const canalesPrefs = preferences[tipo.key] ?? {};
        const activeCount = CANALES.filter((c) => canalesPrefs[c.key] !== false).length;

        return (
          <View key={tipo.key} style={styles.card}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(tipo.key)}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle}>{tipo.label}</Text>
                <Text style={styles.cardSubtitle}>
                  {activeCount} de {CANALES.length} canales activos
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#aaa"
              />
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.cardBody}>
                {CANALES.map((canal) => {
                  const isActive = canalesPrefs[canal.key] !== false;
                  return (
                    <View key={canal.key} style={styles.canalRow}>
                      <View style={styles.canalLeft}>
                        <Ionicons
                          name={CANAL_ICONS[canal.key]}
                          size={20}
                          color={isActive ? '#D9B97E' : '#666'}
                        />
                        <Text style={[styles.canalLabel, !isActive && styles.canalLabelInactive]}>
                          {canal.label}
                        </Text>
                      </View>
                      <Switch
                        value={isActive}
                        onValueChange={(value) =>
                          updatePreference(tipo.key, canal.key as NotificationCanal, value)
                        }
                        trackColor={{ false: '#444', true: '#8a6e3e' }}
                        thumbColor={isActive ? '#D9B97E' : '#aaa'}
                        disabled={saving}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subtitle: {
    flex: 1,
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  savingIndicator: {
    marginLeft: 8,
  },
  loadingText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#D9B97E',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  canalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  canalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  canalLabel: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 10,
  },
  canalLabelInactive: {
    color: '#666',
  },
});