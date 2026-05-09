import React from 'react';
import type { EventFilters as EventFiltersType } from '@uniconnect/shared';
import { EventType } from '@uniconnect/shared';
import { X } from 'lucide-react';
import styles from './EventFilters.module.css';

export interface EventFiltersProps {
  filters: EventFiltersType;
  onFilterChange: (filterType: keyof EventFiltersType, value: any) => void;
  onClearFilters: () => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  [EventType.CONFERENCIA]: 'Conferencia',
  [EventType.TALLER]: 'Taller',
  [EventType.SEMINARIO]: 'Seminario',
  [EventType.COMPETENCIA]: 'Competencia',
  [EventType.CULTURAL]: 'Cultural',
  [EventType.DEPORTIVO]: 'Deportivo',
};

export const EventFilters: React.FC<EventFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = filters.date || filters.type || filters.startDate || filters.endDate;
  const activeTypeLabel = filters.type ? EVENT_TYPE_LABELS[filters.type] : null;

  return (
    <div className={`${styles.container} ${hasActiveFilters ? styles.containerActive : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Filtros</h3>
        {hasActiveFilters && (
          <button onClick={onClearFilters} className={styles.clearButton}>
            <X size={16} className={styles.clearIcon} />
            <span className={styles.clearText}>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Event Type Filter */}
      <div className={styles.filterSection}>
        <label className={styles.label}>Tipo de Evento</label>
        <select
          value={filters.type || ''}
          onChange={(e) => onFilterChange('type', e.target.value || null)}
          className={`${styles.select} ${filters.type ? styles.selectActive : ''}`}
        >
          <option value="">Todos los tipos</option>
          <option value={EventType.CONFERENCIA}>Conferencia</option>
          <option value={EventType.TALLER}>Taller</option>
          <option value={EventType.SEMINARIO}>Seminario</option>
          <option value={EventType.COMPETENCIA}>Competencia</option>
          <option value={EventType.CULTURAL}>Cultural</option>
          <option value={EventType.DEPORTIVO}>Deportivo</option>
        </select>

        {/* Active type pill */}
        {activeTypeLabel && (
          <div className={styles.activePill}>
            <span className={styles.activePillDot} />
            <span>{activeTypeLabel}</span>
            <button
              onClick={() => onFilterChange('type', null)}
              className={styles.pillClear}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Date Filter Info */}
      {(filters.date || filters.startDate || filters.endDate) && (
        <div className={styles.activeFiltersInfo}>
          <span className={styles.infoIcon}>ℹ️</span>
          <span className={styles.infoText}>
            {filters.date && `Fecha: ${filters.date}`}
            {filters.startDate && filters.endDate && 
              `Rango: ${filters.startDate} - ${filters.endDate}`}
          </span>
          <button onClick={() => {
            onFilterChange('date', null);
            onFilterChange('startDate', null);
            onFilterChange('endDate', null);
          }} className={styles.pillClear}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
