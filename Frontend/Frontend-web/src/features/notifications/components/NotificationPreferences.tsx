import React, { useState } from 'react';
import {
  AlertCircle,
  BellRing,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Mail,
  Smartphone,
} from 'lucide-react';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { NotificationCanal } from '../types';
import { authStore } from '@/features/auth/store/AuthStore';
import { LoadingSpinner } from '@/components/elements';
import styles from './NotificationPreferences.module.css';

const CANAL_ICONS: Record<NotificationCanal, React.ElementType> = {
  in_app_websocket: BellRing,
  email_institucional: Mail,
  push_movil: Smartphone,
  resumen_diario: CalendarDays,
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
      <div className={styles.center}>
        <LoadingSpinner size="lg" label="Cargando preferencias..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.center}>
        <AlertCircle size={48} className={styles.errorIcon} />
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryButton} onClick={reloadPreferences}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <p className={styles.subtitle}>
          Configura por qué canales quieres recibir cada tipo de notificación.
        </p>
        {saving && <span className={styles.savingIndicator} aria-label="Guardando" />}
      </div>

      {TIPOS_EVENTO.map((tipo) => {
        const isExpanded = expandedTypes[tipo.key] ?? false;
        const canalesPrefs = preferences[tipo.key] ?? {};
        const activeCount = CANALES.filter((c) => canalesPrefs[c.key] !== false).length;

        return (
          <div key={tipo.key} className={styles.card}>
            <button
              className={styles.cardHeader}
              onClick={() => toggleExpand(tipo.key)}
              type="button"
              aria-expanded={isExpanded}
            >
              <div className={styles.cardHeaderLeft}>
                <h3 className={styles.cardTitle}>{tipo.label}</h3>
                <p className={styles.cardSubtitle}>
                  {activeCount} de {CANALES.length} canales activos
                </p>
              </div>
              {isExpanded ? (
                <ChevronUp size={20} className={styles.chevron} />
              ) : (
                <ChevronDown size={20} className={styles.chevron} />
              )}
            </button>

            {isExpanded && (
              <div className={styles.cardBody}>
                {CANALES.map((canal) => {
                  const isActive = canalesPrefs[canal.key] !== false;
                  const Icon = CANAL_ICONS[canal.key];
                  return (
                    <div key={canal.key} className={styles.canalRow}>
                      <div className={styles.canalLeft}>
                        <Icon size={20} className={isActive ? styles.canalIconActive : styles.canalIcon} />
                        <span className={isActive ? styles.canalLabel : styles.canalLabelInactive}>
                          {canal.label}
                        </span>
                      </div>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(event) =>
                            updatePreference(tipo.key, canal.key as NotificationCanal, event.target.checked)
                          }
                          disabled={saving}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
