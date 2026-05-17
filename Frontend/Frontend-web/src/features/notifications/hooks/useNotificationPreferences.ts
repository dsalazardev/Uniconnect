import { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services';
import { NotificationPreference, NotificationCanal } from '../types';

const CANALES: { key: NotificationCanal; label: string }[] = [
  { key: 'in_app_websocket', label: 'En la app' },
  { key: 'email_institucional', label: 'Correo institucional' },
  { key: 'push_movil', label: 'Push móvil' },
  { key: 'resumen_diario', label: 'Resumen diario' },
];

const TIPOS_EVENTO: { key: string; label: string }[] = [
  { key: 'connection_request', label: 'Solicitudes de conexión' },
  { key: 'message', label: 'Mensajes nuevos' },
  { key: 'group_invitation', label: 'Invitaciones a grupos' },
  { key: 'group_invitation_accepted', label: 'Invitación aceptada' },
  { key: 'user_joined_group', label: 'Nuevo miembro en grupo' },
  { key: 'join_request', label: 'Solicitud de unirse al grupo' },
  { key: 'member_accepted', label: 'Solicitud de ingreso aceptada' },
  { key: 'member_removed', label: 'Eliminado de grupo' },
  { key: 'mention', label: 'Menciones' },
  { key: 'event_published', label: 'Eventos académicos' },
];

export interface PreferenceMap {
  [tipoEvento: string]: {
    [canal: string]: boolean;
  };
}

export function useNotificationPreferences(token: string) {
  const [preferences, setPreferences] = useState<PreferenceMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error) {
      return err.message;
    }
    return fallback;
  };

  const buildMap = useCallback((data: NotificationPreference[]): PreferenceMap => {
    const map: PreferenceMap = {};
    // Inicializar todos los tipos y canales como true (activo por defecto)
    for (const tipo of TIPOS_EVENTO) {
      map[tipo.key] = {};
      for (const canal of CANALES) {
        map[tipo.key][canal.key] = true;
      }
    }
    // Sobreescribir con los valores guardados
    for (const pref of data) {
      if (!map[pref.tipo_evento]) {
        map[pref.tipo_evento] = {};
      }
      map[pref.tipo_evento][pref.canal] = pref.activo;
    }
    return map;
  }, []);

  const loadPreferences = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setPreferences(buildMap([]));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsService.getPreferencias(token);
      setPreferences(buildMap(data));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al cargar preferencias'));
    } finally {
      setLoading(false);
    }
  }, [token, buildMap]);

  const updatePreference = useCallback(
    async (tipoEvento: string, canal: NotificationCanal, activo: boolean) => {
      // Optimistic update
      setPreferences((prev) => ({
        ...prev,
        [tipoEvento]: {
          ...(prev[tipoEvento] ?? {}),
          [canal]: activo,
        },
      }));
      try {
        setSaving(true);
        await notificationsService.updatePreferencia({ tipo_evento: tipoEvento, canal, activo }, token);
      } catch (err: unknown) {
        // Revertir en caso de error
        setPreferences((prev) => ({
          ...prev,
          [tipoEvento]: {
            ...(prev[tipoEvento] ?? {}),
            [canal]: !activo,
          },
        }));
        setError(getErrorMessage(err, 'Error al guardar preferencia'));
      } finally {
        setSaving(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    saving,
    error,
    updatePreference,
    reloadPreferences: loadPreferences,
    CANALES,
    TIPOS_EVENTO,
  };
}