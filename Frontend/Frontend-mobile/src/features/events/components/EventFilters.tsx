import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { EventFilters as EventFiltersType, EventType } from '../types/event.types';

export interface EventFiltersProps {
  filters: EventFiltersType;
  onFilterChange: (filterType: keyof EventFiltersType, value: any) => void;
  onClearFilters: () => void;
}

/**
 * EventFilters - Pure component for filtering events
 * Receives filters state and callbacks as props
 * No business logic or network calls
 */
export const EventFilters: React.FC<EventFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = filters.date || filters.type || filters.startDate || filters.endDate;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filtros</Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={onClearFilters} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#0056b3" />
            <Text style={styles.clearText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Event Type Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.label}>Tipo de Evento</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={filters.type || ''}
            onValueChange={(value) => onFilterChange('type', value || null)}
            style={styles.picker}
          >
            <Picker.Item label="Todos los tipos" value="" />
            <Picker.Item label="Conferencia" value={EventType.CONFERENCIA} />
            <Picker.Item label="Taller" value={EventType.TALLER} />
            <Picker.Item label="Seminario" value={EventType.SEMINARIO} />
            <Picker.Item label="Competencia" value={EventType.COMPETENCIA} />
            <Picker.Item label="Cultural" value={EventType.CULTURAL} />
            <Picker.Item label="Deportivo" value={EventType.DEPORTIVO} />
          </Picker>
        </View>
      </View>

      {/* Date Filter Info */}
      {(filters.date || filters.startDate || filters.endDate) && (
        <View style={styles.activeFiltersInfo}>
          <Ionicons name="information-circle" size={16} color="#0056b3" />
          <Text style={styles.infoText}>
            {filters.date && `Fecha: ${filters.date}`}
            {filters.startDate && filters.endDate && 
              `Rango: ${filters.startDate} - ${filters.endDate}`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    color: '#0056b3',
    fontSize: 14,
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  activeFiltersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#0056b3',
    flex: 1,
  },
});
