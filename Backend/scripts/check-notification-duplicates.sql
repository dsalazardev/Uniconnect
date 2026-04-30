-- ============================================================================
-- BACKEND NOTIFICATION INTEGRITY CHECK - SQL QUERIES
-- ============================================================================
-- Execute these queries directly in your PostgreSQL database to verify
-- if the backend is creating duplicate notifications
-- ============================================================================

-- QUERY 1: Check for duplicate unread notifications
-- This finds notifications with the same user, entity, and type
-- If this returns rows, the backend IS creating duplicates
SELECT 
    id_user,
    related_entity_id,
    notification_type,
    COUNT(*) as duplicate_count,
    STRING_AGG(id_notification::text, ', ') as notification_ids,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM notification
WHERE is_read = false
GROUP BY id_user, related_entity_id, notification_type
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- QUERY 2: Check for duplicate notifications (all, not just unread)
-- This checks the entire notification table for duplicates
SELECT 
    id_user,
    related_entity_id,
    notification_type,
    is_read,
    COUNT(*) as duplicate_count,
    STRING_AGG(id_notification::text, ', ') as notification_ids
FROM notification
GROUP BY id_user, related_entity_id, notification_type, is_read
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- QUERY 3: Check for notifications with same message content
-- This finds notifications with identical messages for the same user
SELECT 
    id_user,
    message,
    notification_type,
    COUNT(*) as duplicate_count,
    STRING_AGG(id_notification::text, ', ') as notification_ids,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM notification
WHERE is_read = false
GROUP BY id_user, message, notification_type
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- QUERY 4: Get total unread count per user
-- This shows the actual count that getUnreadCount() should return
SELECT 
    id_user,
    COUNT(*) as unread_count
FROM notification
WHERE is_read = false
GROUP BY id_user
ORDER BY unread_count DESC;

-- QUERY 5: Check for notifications created within 1 second of each other
-- This detects rapid duplicate creation (race conditions)
WITH notification_pairs AS (
    SELECT 
        n1.id_notification as id1,
        n2.id_notification as id2,
        n1.id_user,
        n1.notification_type,
        n1.related_entity_id,
        n1.created_at as created1,
        n2.created_at as created2,
        EXTRACT(EPOCH FROM (n2.created_at - n1.created_at)) as time_diff_seconds
    FROM notification n1
    JOIN notification n2 ON 
        n1.id_user = n2.id_user 
        AND n1.notification_type = n2.notification_type
        AND n1.related_entity_id = n2.related_entity_id
        AND n1.id_notification < n2.id_notification
    WHERE 
        n1.is_read = false 
        AND n2.is_read = false
        AND n2.created_at - n1.created_at < INTERVAL '1 second'
)
SELECT * FROM notification_pairs
ORDER BY time_diff_seconds ASC;

-- QUERY 6: Check notification creation rate (last 24 hours)
-- This shows if there's an unusual spike in notification creation
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    notification_type,
    COUNT(*) as notifications_created
FROM notification
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), notification_type
ORDER BY hour DESC, notifications_created DESC;

-- QUERY 7: Check for orphaned notifications (related_entity doesn't exist)
-- This finds notifications pointing to non-existent entities
SELECT 
    n.id_notification,
    n.id_user,
    n.notification_type,
    n.related_entity_id,
    n.created_at,
    CASE 
        WHEN n.notification_type = 'connection_request' THEN 
            (SELECT COUNT(*) FROM connection WHERE id_connection = n.related_entity_id)
        WHEN n.notification_type = 'group_invitation' THEN 
            (SELECT COUNT(*) FROM group_invitation WHERE id_invitation = n.related_entity_id)
        WHEN n.notification_type = 'group_join_request' THEN 
            (SELECT COUNT(*) FROM group_join_request WHERE id_request = n.related_entity_id)
        WHEN n.notification_type = 'message' THEN 
            (SELECT COUNT(*) FROM message WHERE id_message = n.related_entity_id)
        ELSE 1
    END as entity_exists
FROM notification n
WHERE n.related_entity_id IS NOT NULL
HAVING entity_exists = 0;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================
-- 
-- QUERY 1 Results:
-- - If EMPTY: Backend is NOT creating duplicates ✅
-- - If HAS ROWS: Backend IS creating duplicates 🔴
--   → Check notification_ids to see which notifications are duplicated
--   → Check time difference between first_created and last_created
--   → If < 1 second: Race condition in event listener
--   → If > 1 second: Multiple event emissions
--
-- QUERY 2 Results:
-- - Shows historical duplicates (including read notifications)
-- - Helps identify if duplicates were created in the past
--
-- QUERY 3 Results:
-- - Detects duplicates by message content (more lenient)
-- - Useful if related_entity_id is different but message is same
--
-- QUERY 4 Results:
-- - Shows the CORRECT unread count per user
-- - Compare this with what the API returns
-- - If API returns double: Problem is in getUnreadCount() method
--
-- QUERY 5 Results:
-- - Detects race conditions (notifications created < 1 second apart)
-- - If HAS ROWS: Event listener is being called multiple times
--
-- QUERY 6 Results:
-- - Shows notification creation patterns
-- - Helps identify if there's a spike in creation rate
--
-- QUERY 7 Results:
-- - Finds orphaned notifications (data integrity issue)
-- - These should be cleaned up
--
-- ============================================================================
