export class CreateMessageDto {
  // Requerido para mensajes de grupo; se resuelve de la sesión WebSocket en mensajes privados
  id_membership: number;

  // Campos exclusivos de mensajes privados — el gateway los usa para construir el room_id
  // y para resolver id_membership del grupo DM antes de llamar al servicio
  sender_id?: number;
  recipient_id?: number;

  text_content?: string;

  send_at?: Date;

  attachments?: string | null;

  files?: Array<{
    url: string;
    file_name: string;
    mime_type: string;
    size: number;
    id_group: number;
  }>;

  mentions?: Array<{
    userId: number;
    displayName: string;
    position: number;
  }>;
}

