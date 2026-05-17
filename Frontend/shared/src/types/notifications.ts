// Notification types

export type PushTokenPayload = {
  token: string;
  device_type: string;
  device_name: string;
};

export type NotificationType =
  | 'connection_request'
  | 'message'
  | 'group_invitation'
  | 'group_invitation_accepted'
  | 'user_joined_group'
  | 'group_join_request'
  | 'group_join_request_accepted'
  | 'group_join_request_rejected'
  | 'member_accepted'
  | 'member_removed'
  | 'join_request'
  | 'mention'
  | 'admin_transfer_requested'
  | 'admin_transfer_accepted'
  | 'admin_transfer_declined'
  | 'group_created'
  | 'group_deleted'
  | 'event_published';

export type Notification = {
  id_notification: number;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type: NotificationType;
  related_entity_id: number;
};

export interface MarkAsReadResponse {
  success: boolean;
}

export interface MarkAllAsReadResponse {
  success: boolean;
  updated: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationCount {
  count: number;
}
