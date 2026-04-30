-- Migration: Add index for notification deduplication
-- Date: 2026-04-29
-- Purpose: Optimize duplicate check query in createNotificationIdempotent()

CREATE INDEX IF NOT EXISTS idx_notification_dedup 
ON notification (id_user, created_at DESC, notification_type, related_entity_id);

-- This composite index optimizes the query:
-- WHERE id_user = X AND created_at >= Y AND notification_type = Z AND related_entity_id = W
