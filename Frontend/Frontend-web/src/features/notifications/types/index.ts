export type NotificationCanal =
  | 'in_app_websocket'
  | 'email_institucional'
  | 'push_movil'
  | 'resumen_diario';

export interface NotificationPreference {
  tipo_evento: string;
  canal: NotificationCanal;
  activo: boolean;
}

export interface UpdatePreferencePayload {
  tipo_evento: string;
  canal: NotificationCanal;
  activo: boolean;
}

export interface UpdatePreferenceResponse {
  success: boolean;
}
